require('dotenv').config(); // Load environment variables from .env file
const WebSocket = require("ws");
const { createClient } = require("@supabase/supabase-js");

// --- Configuration (Loaded from .env) ---
const TON_CENTER_WEBSOCKET_ENDPOINT = process.env.TON_CENTER_WEBSOCKET_ENDPOINT || 'wss://testnet.toncenter.com/api/v3/websocket'; // Fallback for safety
const BACKEND_WEBSOCKET_PORT = process.env.BACKEND_WEBSOCKET_PORT || 8080;
const SUPABASE_URL = process.env.SUPABASE_URL;
// Use Service Key if available, otherwise fallback to Anon Key (less secure for backend writes)
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
const PROJECT_WALLET_ADDRESS = process.env.PROJECT_WALLET_ADDRESS;

// --- Validate Essential Configuration ---
if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("FATAL ERROR: Supabase URL or Key not configured in .env file.");
    process.exit(1); // Exit if Supabase config is missing
}
if (!PROJECT_WALLET_ADDRESS) {
    console.error("FATAL ERROR: Project Wallet Address not configured in .env file.");
    process.exit(1);
}
if (!TON_CENTER_WEBSOCKET_ENDPOINT || TON_CENTER_WEBSOCKET_ENDPOINT.includes('YOUR_TON_NODE_URL_HERE')) {
     console.warn("WARNING: TON_CENTER_WEBSOCKET_ENDPOINT is not configured correctly in .env file or still contains placeholder.");
}

// --- Supabase Client Initialization ---
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
console.log("Supabase client initialized.");

// --- WebSocket Server Setup (Backend) ---
const wss = new WebSocket.Server({ port: BACKEND_WEBSOCKET_PORT });
console.log(`Backend WebSocket server started on port ${BACKEND_WEBSOCKET_PORT}`);

const clients = new Map(); // Map<WebSocket, { tonWs: WebSocket | null, details: object | null, verified: boolean, userId: string | null }>

wss.on("connection", (frontendWs) => {
    console.log("Frontend client connected");
    const clientId = generateUniqueId();
    clients.set(frontendWs, { tonWs: null, details: null, verified: false, id: clientId, userId: null });
    console.log(`Client ${clientId} assigned.`);

    frontendWs.on("message", (message) => {
        console.log(`Received message from frontend client ${clientId}: ${message}`);
        try {
            const data = JSON.parse(message);

            if (data.type === 'start_verification' && data.details && data.userId) {
                const clientData = clients.get(frontendWs);
                if (clientData && !clientData.details) {
                    clientData.details = data.details; // Store payment details (address, amountNano, comment, packageId)
                    clientData.userId = data.userId; // Store user ID
                    console.log(`Starting verification for client ${clientId} (User: ${data.userId}) with details:`, data.details);
                    // Use the configured project wallet address from .env
                    if (clientData.details.address !== PROJECT_WALLET_ADDRESS) {
                        console.warn(`Client ${clientId} provided address ${clientData.details.address} does not match configured PROJECT_WALLET_ADDRESS ${PROJECT_WALLET_ADDRESS}. Using configured address.`);
                        clientData.details.address = PROJECT_WALLET_ADDRESS;
                    }
                    connectToTonCenter(frontendWs, clientId);
                } else if (clientData && clientData.details) {
                    console.log(`Verification already in progress for client ${clientId}`);
                } else {
                     console.error(`Client data not found for client ${clientId}`);
                     sendToFrontend(frontendWs, { type: 'error', message: 'Client session error.' });
                }
            } else if (data.type === 'start_verification' && (!data.details || !data.userId)) {
                 console.error(`Missing details or userId for start_verification from client ${clientId}`);
                 sendToFrontend(frontendWs, { type: 'error', message: 'Missing payment details or user ID.' });
            }
        } catch (e) {
            console.error(`Failed to parse message or invalid message format from client ${clientId}:`, e);
            sendToFrontend(frontendWs, { type: 'error', message: 'Invalid message format.' });
        }
    });

    frontendWs.on("close", () => {
        console.log(`Frontend client ${clientId} disconnected`);
        const clientData = clients.get(frontendWs);
        if (clientData && clientData.tonWs) {
            console.log(`Closing TON Center WebSocket for client ${clientId}`);
            clientData.tonWs.close();
        }
        clients.delete(frontendWs);
    });

    frontendWs.on("error", (error) => {
        console.error(`Frontend client ${clientId} error:`, error);
        const clientData = clients.get(frontendWs);
        if (clientData && clientData.tonWs) {
            clientData.tonWs.close();
        }
        clients.delete(frontendWs);
    });

    sendToFrontend(frontendWs, { type: 'info', message: 'Connected to backend verification server.' });
});

// --- TON Center WebSocket Logic ---
function connectToTonCenter(frontendWs, clientId) {
    const clientData = clients.get(frontendWs);
    if (!clientData || !clientData.details || !clientData.userId) {
        console.error(`Cannot connect to TON Center: Missing details or userId for client ${clientId}`);
        sendToFrontend(frontendWs, { type: 'error', message: 'Verification details or user ID missing.' });
        return;
    }
    if (clientData.tonWs) {
        console.log(`TON Center WebSocket already exists for client ${clientId}`);
        return;
    }

    // Use details stored in clientData, including the potentially corrected address
    const { address, amountNano, comment, packageId } = clientData.details;
    const userId = clientData.userId;

    console.log(`Connecting to TON Center WebSocket (${TON_CENTER_WEBSOCKET_ENDPOINT}) for client ${clientId}`);
    sendToFrontend(frontendWs, { type: 'status', message: 'Connecting to TON network...' });

    try {
        const tonWs = new WebSocket(TON_CENTER_WEBSOCKET_ENDPOINT);
        clientData.tonWs = tonWs;

        tonWs.onopen = () => {
            console.log(`TON Center WebSocket connection established for client ${clientId}`);
            sendToFrontend(frontendWs, { type: 'status', message: 'Connected to TON network. Subscribing to address...' });

            const subscriptionMessage = JSON.stringify({
                method: 'subscribe_account',
                params: [address] // Subscribe to the project wallet address
            });
            console.log(`Sending subscription message for client ${clientId}: ${subscriptionMessage}`);
            tonWs.send(subscriptionMessage);
            sendToFrontend(frontendWs, { type: 'status', message: 'Subscribed. Waiting for payment confirmation...' });
        };

        tonWs.onmessage = async (event) => {
            console.log(`TON Center message received for client ${clientId}: ${event.data}`);
            try {
                const messageData = JSON.parse(event.data);

                if (messageData.method === 'account_transaction' && messageData.params) {
                    const tx = messageData.params;
                    sendToFrontend(frontendWs, { type: 'status', message: 'Transaction data received. Verifying...' });

                    const isCorrectAddress = tx.account === address;
                    const receivedAmount = tx.in_msg?.value;
                    const isCorrectAmount = receivedAmount === amountNano.toString();
                    const receivedComment = tx.in_msg?.message;
                    const isCorrectComment = receivedComment === comment;
                    const isIncoming = tx.in_msg?.source !== '';

                    console.log(`Client ${clientId} Verification: Addr=${isCorrectAddress}, Amt=${isCorrectAmount}(Exp:${amountNano}, Rcv:${receivedAmount}), Cmt=${isCorrectComment}(Exp:'${comment}', Rcv:'${receivedComment}'), Incoming=${isIncoming}`);

                    if (isIncoming && isCorrectAddress && isCorrectAmount && isCorrectComment) {
                        console.log(`Payment verified successfully for client ${clientId}!`);
                        clientData.verified = true;
                        sendToFrontend(frontendWs, { type: 'status', message: 'Payment verified. Activating package...' });
                        tonWs.close();

                        // --- Activate Package in Database ---
                        try {
                            console.log(`Activating package ${packageId} for user ${userId}...`);
                            const { data: updateData, error: updateError } = await supabase
                                .from('profiles') // Ensure 'profiles' is your user table name
                                .update({ active_package_id: packageId }) // Ensure 'active_package_id' is the correct column
                                .eq('id', userId); // Ensure 'id' is the user ID column

                            if (updateError) {
                                console.error(`Supabase update error for user ${userId}:`, updateError);
                                sendToFrontend(frontendWs, { type: 'error', message: `Payment verified, but failed to activate package: ${updateError.message}` });
                            } else {
                                console.log(`Package ${packageId} activated successfully for user ${userId}.`);
                                sendToFrontend(frontendWs, { type: 'success', message: 'Payment verified and package activated successfully!' });
                            }
                        } catch (dbError) {
                            console.error(`Database operation failed for user ${userId}:`, dbError);
                            sendToFrontend(frontendWs, { type: 'error', message: 'Payment verified, but a database error occurred during activation.' });
                        }
                        // ----------------------------------------

                    } else {
                        console.log(`Transaction details mismatch for client ${clientId}. Continuing watch.`);
                        sendToFrontend(frontendWs, { type: 'status', message: 'Transaction received, but details mismatch. Continuing watch...' });
                    }
                } else {
                     console.log(`Non-transaction message received for client ${clientId}. Ignoring.`);
                }
            } catch (parseError) {
                console.error(`Error parsing TON Center message for client ${clientId}:`, parseError);
                sendToFrontend(frontendWs, { type: 'status', message: 'Error processing transaction data. Continuing watch...' });
            }
        };

        tonWs.onerror = (errorEvent) => {
            console.error(`TON Center WebSocket error for client ${clientId}:`, errorEvent.message);
            sendToFrontend(frontendWs, { type: 'error', message: 'TON network connection error.' });
            clientData.tonWs = null;
        };

        tonWs.onclose = (closeEvent) => {
            console.log(`TON Center WebSocket connection closed for client ${clientId}: ${closeEvent.code} ${closeEvent.reason}`);
            if (!clientData.verified) {
                 sendToFrontend(frontendWs, { type: 'info', message: 'Disconnected from TON network watch.' });
            }
            clientData.tonWs = null;
        };

    } catch (connectionError) {
        console.error(`Failed to create TON Center WebSocket connection for client ${clientId}:`, connectionError);
        sendToFrontend(frontendWs, { type: 'error', message: 'Failed to connect to TON network.' });
        clientData.tonWs = null;
    }
}

// --- Helper Functions ---
function sendToFrontend(ws, data) {
    try {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(data));
        } else {
            console.log("Attempted to send message to closed frontend WebSocket.");
        }
    } catch (error) {
        console.error("Failed to send message to frontend:", error);
    }
}

function generateUniqueId() {
    return Math.random().toString(36).substring(2, 15);
}

console.log("Backend server script finished setup.");

