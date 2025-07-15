'use client';

import { useTranslations } from 'next-intl';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@web/components/ui/card';
import { Button } from '@web/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@web/components/ui/avatar';
import {
  BarChart3,
  TrendingUp,
  Users,
  CheckSquare,
  Clock,
  Plus,
  ArrowRight,
  MessageSquare,
  Settings,
  Bell,
  Activity,
  Target,
  Folder,
  UserPlus,
} from 'lucide-react';
import { StatCard } from '@web/components/dashboard/stat-card';
import { ProgressBar } from '@web/components/dashboard/progress-bar';
import { TaskItem } from '@web/components/dashboard/task-item';
import SimpleSidebar from '@web/components/sidebar/simple-sidebar';

// 模拟数据
const mockStats = [
  {
    title: 'dashboard.taskProgress',
    value: '24',
    change: '+12%',
    changeType: 'positive' as const,
    icon: CheckSquare,
    description: 'dashboard.completed',
  },
  {
    title: 'dashboard.team',
    value: '12',
    change: '+2',
    changeType: 'positive' as const,
    icon: Users,
    description: 'dashboard.status.active',
  },
  {
    title: 'dashboard.projects',
    value: '8',
    change: '+3',
    changeType: 'positive' as const,
    icon: Folder,
    description: 'dashboard.inProgress',
  },
  {
    title: 'dashboard.performanceMetrics',
    value: '94%',
    change: '+5%',
    changeType: 'positive' as const,
    icon: TrendingUp,
    description: 'dashboard.status.completed',
  },
];

const mockRecentTasks = [
  {
    id: 1,
    title: '完成用户界面设计',
    project: 'AI Assistant',
    priority: 'high' as const,
    status: 'inProgress' as const,
    assignee: {
      name: '张三',
      avatar: null,
    },
    dueDate: '2024-03-25',
  },
  {
    id: 2,
    title: '后端API开发',
    project: 'AI Assistant',
    priority: 'medium' as const,
    status: 'pending' as const,
    assignee: {
      name: '李四',
      avatar: null,
    },
    dueDate: '2024-03-27',
  },
  {
    id: 3,
    title: '数据库优化',
    project: 'Dashboard',
    priority: 'low' as const,
    status: 'completed' as const,
    assignee: {
      name: '王五',
      avatar: null,
    },
    dueDate: '2024-03-20',
  },
];

const mockTeamActivity = [
  {
    id: 1,
    user: '张三',
    action: '完成了任务',
    target: 'UI设计评审',
    time: '2小时前',
    avatar: null,
  },
  {
    id: 2,
    user: '李四',
    action: '创建了项目',
    target: '移动端应用',
    time: '4小时前',
    avatar: null,
  },
  {
    id: 3,
    user: '王五',
    action: '更新了文档',
    target: 'API接口文档',
    time: '6小时前',
    avatar: null,
  },
];

const mockPerformanceData = [
  { label: '任务完成率', value: 85, color: 'green' as const },
  { label: '团队效率', value: 92, color: 'blue' as const },
  { label: '项目进度', value: 76, color: 'purple' as const },
];

export default function Dashboard() {
  const t = useTranslations();

  return (
    <div className="bg-background flex h-screen w-screen">
      {/* 侧边栏 */}
      <SimpleSidebar />

      {/* 主内容区域 */}
      <div className="flex-1 overflow-auto">
        <div className="space-y-6 p-6 pb-16">
          {/* 页面标题和快速操作 */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {t('dashboard.title')}
              </h1>
              <p className="text-muted-foreground">{t('dashboard.welcome')}</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Bell className="mr-2 h-4 w-4" />
                {t('dashboard.notifications')}
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="mr-2 h-4 w-4" />
                {t('dashboard.settings')}
              </Button>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                {t('dashboard.newProject')}
              </Button>
            </div>
          </div>

          {/* 统计卡片 */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {mockStats.map((stat, index) => (
              <StatCard
                key={index}
                title={t(stat.title)}
                value={stat.value}
                change={stat.change}
                changeType={stat.changeType}
                icon={stat.icon}
                description={t(stat.description)}
              />
            ))}
          </div>

          <div className="grid gap-6 md:grid-cols-7">
            {/* 主要内容区 */}
            <div className="col-span-4 space-y-6">
              {/* 快速操作 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="mr-2 h-5 w-5" />
                    {t('dashboard.quickActions')}
                  </CardTitle>
                  <CardDescription>常用操作和快捷入口</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" className="h-20 flex-col">
                      <Plus className="mb-2 h-6 w-6" />
                      {t('dashboard.newTask')}
                    </Button>
                    <Button variant="outline" className="h-20 flex-col">
                      <UserPlus className="mb-2 h-6 w-6" />
                      邀请成员
                    </Button>
                    <Button variant="outline" className="h-20 flex-col">
                      <BarChart3 className="mb-2 h-6 w-6" />
                      {t('dashboard.analytics')}
                    </Button>
                    <Button variant="outline" className="h-20 flex-col">
                      <MessageSquare className="mb-2 h-6 w-6" />
                      {t('dashboard.chat')}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* 最近任务 */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <CheckSquare className="mr-2 h-5 w-5" />
                      {t('dashboard.tasks')}
                    </CardTitle>
                    <CardDescription>
                      {t('dashboard.taskProgress')}
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="sm">
                    {t('dashboard.viewAll')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mockRecentTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      {...task}
                      onClick={() => console.log('打开任务:', task.title)}
                    />
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* 侧边栏 */}
            <div className="col-span-3 space-y-6">
              {/* 最近项目 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Folder className="mr-2 h-5 w-5" />
                    {t('dashboard.recentProjects')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {['AI Assistant', 'Dashboard Pro', 'Mobile App'].map(
                    (project, index) => (
                      <div
                        key={index}
                        className="hover:bg-muted/50 flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
                            <Folder className="text-primary h-4 w-4" />
                          </div>
                          <span className="font-medium">{project}</span>
                        </div>
                        <ArrowRight className="text-muted-foreground h-4 w-4" />
                      </div>
                    ),
                  )}
                </CardContent>
              </Card>

              {/* 团队动态 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="mr-2 h-5 w-5" />
                    {t('dashboard.teamActivity')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mockTeamActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start space-x-3"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={activity.avatar || ''} />
                        <AvatarFallback>
                          {activity.user.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm">
                          <span className="font-medium">{activity.user}</span>{' '}
                          {activity.action}{' '}
                          <span className="font-medium">{activity.target}</span>
                        </p>
                        <div className="text-muted-foreground flex items-center text-xs">
                          <Clock className="mr-1 h-3 w-3" />
                          {activity.time}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* 性能概览 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="mr-2 h-5 w-5" />
                    {t('dashboard.performanceMetrics')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mockPerformanceData.map((metric, index) => (
                    <ProgressBar
                      key={index}
                      label={metric.label}
                      value={metric.value}
                      color={metric.color}
                    />
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
