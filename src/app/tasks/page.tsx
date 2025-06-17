import BottomNavigation from '@/components/layout/BottomNavigation';
import { FaTwitter, FaTelegram, FaInstagram, FaYoutube, FaCheck, FaCoins } from 'react-icons/fa';
import { useState } from 'react';

export default function TasksPage() {
  const [tasks, setTasks] = useState([
    { 
      id: 1, 
      title: 'متابعة حساب X (تويتر)', 
      description: 'قم بمتابعة الحساب الرسمي على منصة X', 
      icon: FaTwitter, 
      link: 'https://x.com/smartcoinoff',
      reward: 50,
      completed: false
    },
    { 
      id: 2, 
      title: 'متابعة قناة تيليغرام', 
      description: 'قم بمتابعة القناة الرسمية على تيليغرام', 
      icon: FaTelegram, 
      link: 'https://t.me/smartcoinapp',
      reward: 50,
      completed: false
    },
    { 
      id: 3, 
      title: 'متابعة إنستغرام', 
      description: 'قم بمتابعة الحساب الرسمي على إنستغرام', 
      icon: FaInstagram, 
      link: 'https://www.instagram.com/smartcoin_app',
      reward: 50,
      completed: false
    },
    { 
      id: 4, 
      title: 'الاشتراك في يوتيوب', 
      description: 'قم بالاشتراك في القناة الرسمية على يوتيوب', 
      icon: FaYoutube, 
      link: 'https://youtube.com/@smartcoinapp',
      reward: 50,
      completed: false
    },
  ]);

  const completeTask = (taskId) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, completed: true } : task
    ));
  };

  const openTaskLink = (link) => {
    window.open(link, '_blank');
  };

  return (
    <div className="min-h-screen pb-20">
      {/* رأس الصفحة */}
      <header className="p-4 text-center">
        <h1 className="text-2xl font-bold gold-text">المهام</h1>
      </header>

      {/* قائمة المهام */}
      <div className="p-4">
        <div className="card">
          <h2 className="text-lg font-bold mb-4">المهام المتاحة</h2>
          <div className="space-y-4">
            {tasks.map(task => (
              <div key={task.id} className="task-item">
                <div className="task-icon">
                  <task.icon size={24} />
                </div>
                <div className="task-content">
                  <h3 className="task-title">{task.title}</h3>
                  <p className="task-description">{task.description}</p>
                </div>
                <div className="task-reward ml-2">
                  <FaCoins className="inline mr-1" size={14} />
                  {task.reward}
                </div>
                {task.completed ? (
                  <button className="primary-button ml-2 px-3 py-2" disabled>
                    <FaCheck size={16} />
                  </button>
                ) : (
                  <button 
                    className="primary-button ml-2 px-3 py-2"
                    onClick={() => {
                      openTaskLink(task.link);
                      // في التطبيق الحقيقي، سيتم التحقق من إكمال المهمة
                      // قبل تحديثها كمكتملة
                      completeTask(task.id);
                    }}
                  >
                    <span>متابعة</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* المهام المكتملة */}
      <div className="p-4">
        <div className="card">
          <h2 className="text-lg font-bold mb-4">إحصائيات المهام</h2>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-400">المهام المكتملة</p>
              <p className="text-xl font-bold gold-text">
                {tasks.filter(task => task.completed).length}/{tasks.length}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">المكافآت المكتسبة</p>
              <p className="text-xl font-bold gold-text">
                <FaCoins className="inline mr-1" size={14} />
                {tasks.filter(task => task.completed).reduce((sum, task) => sum + task.reward, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* شريط التنقل السفلي */}
      <BottomNavigation currentPath="/tasks" />
    </div>
  );
}
