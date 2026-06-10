import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import ReactECharts from 'echarts-for-react';
import 'echarts-wordcloud';
import { 
  getTopicVelocity, 
  getKeywordsCloud, 
  getActivityHeatmap, 
  getTopicRace, 
  getTrendingPapers, 
  getTopAuthors, 
  getRisingTopics 
} from '@/lib/api';
import { Spinner } from '@/components/ui/spinner';
import { Trophy, TrendingUp, BarChart2, Crown, Zap, Flame, TrendingDown, Hash, Rocket, Sparkles } from 'lucide-react';

const LeaderboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'dashboard'>('leaderboard');
  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month' | 'all'>('month');

  const { data: velocityData, isLoading: isLoadingVelocity } = useQuery({
    queryKey: ['topicVelocity'],
    queryFn: () => getTopicVelocity({ topics: 'cs.AI,cs.LG', interval: 'month' }),
    enabled: activeTab === 'dashboard'
  });

  const { data: wordCloudData, isLoading: isLoadingCloud } = useQuery({
    queryKey: ['keywordsCloud'],
    queryFn: () => getKeywordsCloud({ days: 30 }),
    enabled: activeTab === 'dashboard'
  });

  const { data: heatmapData, isLoading: isLoadingHeatmap } = useQuery({
    queryKey: ['activityHeatmap'],
    queryFn: getActivityHeatmap,
    enabled: activeTab === 'dashboard'
  });

  const { data: raceData, isLoading: isLoadingRace } = useQuery({
    queryKey: ['topicRace'],
    queryFn: getTopicRace,
    enabled: activeTab === 'dashboard'
  });

  // Leaderboard APIs
  const { data: trendingData, isLoading: isLoadingTrending } = useQuery({
    queryKey: ['trendingPapers', timeframe],
    queryFn: () => getTrendingPapers({ timeframe }),
    enabled: activeTab === 'leaderboard'
  });

  const { data: authorsData, isLoading: isLoadingAuthors } = useQuery({
    queryKey: ['topAuthors', timeframe],
    queryFn: () => getTopAuthors({ timeframe }),
    enabled: activeTab === 'leaderboard'
  });

  const { data: risingData, isLoading: isLoadingRising } = useQuery({
    queryKey: ['risingTopics', timeframe],
    queryFn: () => getRisingTopics({ timeframe }),
    enabled: activeTab === 'leaderboard'
  });

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 text-foreground">Statistics Center</h1>
          <p className="text-muted-foreground text-sm">Real-time insights and leaderboards across all topics.</p>
        </div>
        
        <div className="flex bg-muted/50 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'leaderboard' 
                ? 'bg-background text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="flex items-center gap-2">
              <Trophy size={16} /> Leaderboard
            </div>
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'dashboard' 
                ? 'bg-background text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="flex items-center gap-2">
              <BarChart2 size={16} /> Trends Dashboard
            </div>
          </button>
        </div>
      </div>

      {activeTab === 'leaderboard' ? (
        <div className="flex flex-col gap-6">
          {/* Timeframe selector */}
          <div className="flex justify-end mb-4">
            <div className="flex items-center bg-card border border-border p-1 rounded-xl shadow-sm">
              {[
                { id: 'today', label: 'Today', color: 'text-blue-500', bg: 'bg-blue-500/10' },
                { id: 'week', label: 'This Week', color: 'text-green-500', bg: 'bg-green-500/10' },
                { id: 'month', label: 'This Month', color: 'text-orange-500', bg: 'bg-orange-500/10' },
                { id: 'all', label: 'All Time', color: 'text-purple-500', bg: 'bg-purple-500/10' }
              ].map(opt => {
                const isActive = timeframe === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setTimeframe(opt.id as any)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 cursor-pointer ${
                      isActive 
                        ? `${opt.bg} ${opt.color} shadow-sm transform scale-105` 
                        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                    }`}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Authors */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary/20 text-primary rounded-xl"><Trophy size={20} /></div>
                <h2 className="text-xl font-bold">Top Authors</h2>
              </div>
              {isLoadingAuthors ? <Spinner /> : (
                <div className="space-y-4">
                  {authorsData?.map((author: any, idx: number) => {
                    const isTop1 = idx === 0;
                    const isTop2 = idx === 1;
                    const isTop3 = idx === 2;
                    const name = author.author || author.name || 'Unknown';
                    const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`;
                    
                    return (
                    <div key={idx} className={`flex items-center justify-between p-3 rounded-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer group ${
                      isTop1 ? 'bg-yellow-500/10 border border-yellow-500/30 hover:border-yellow-500 hover:shadow-[0_0_15px_rgba(234,179,8,0.2)]' : 
                      isTop2 ? 'bg-gray-400/10 border border-gray-400/20 hover:border-gray-400 hover:shadow-[0_0_15px_rgba(156,163,175,0.2)]' :
                      isTop3 ? 'bg-amber-600/10 border border-amber-600/20 hover:border-amber-600 hover:shadow-[0_0_15px_rgba(217,119,6,0.2)]' :
                      'hover:bg-muted/50 border border-transparent'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-6 font-bold text-sm">
                          {isTop1 ? <Crown size={20} className="text-yellow-500 drop-shadow-sm" /> :
                           isTop2 ? <Crown size={18} className="text-gray-400" /> :
                           isTop3 ? <Crown size={18} className="text-amber-600" /> :
                           <span className="text-muted-foreground">{idx + 1}</span>}
                        </div>
                        <div className="relative">
                          <img src={avatarUrl} alt="avatar" className={`w-10 h-10 rounded-full bg-card p-1 ${
                            isTop1 ? 'ring-2 ring-yellow-500' :
                            isTop2 ? 'ring-2 ring-gray-400' :
                            isTop3 ? 'ring-2 ring-amber-600' : ''
                          }`} />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-foreground">{name}</span>
                          <span className="text-xs text-muted-foreground">@{name.replace(/\s+/g, '').toLowerCase()}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1 text-sm font-bold text-primary group-hover:text-primary/80 transition-colors">
                          <Zap size={14} className={isTop1 ? 'text-yellow-500' : 'text-primary'} fill={isTop1 ? '#eab308' : 'currentColor'} />
                          {Math.round(author.totalScore) || 0}
                        </div>
                        <span className="text-[10px] text-muted-foreground">{author.paperCount || 0} papers</span>
                      </div>
                    </div>
                  )})}
                </div>
              )}
            </div>

            {/* Trending Papers */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-orange-500/20 text-orange-500 rounded-xl"><TrendingUp size={20} /></div>
                <h2 className="text-xl font-bold">Trending Papers</h2>
              </div>
              {isLoadingTrending ? <Spinner /> : (
                <div className="space-y-4">
                  {trendingData?.map((paper: any, idx: number) => {
                    const isTop1 = idx === 0;
                    const isTop2 = idx === 1;
                    const isTop3 = idx === 2;
                    return (
                    <div key={idx} className={`relative p-3 rounded-xl border transition-all duration-300 hover:scale-[1.02] cursor-pointer group flex gap-3 ${
                      isTop1 ? 'border-orange-500/50 bg-orange-500/5 hover:border-orange-500 hover:shadow-[0_0_15px_rgba(249,115,22,0.15)]' :
                      isTop2 ? 'border-orange-400/40 bg-orange-400/5 hover:border-orange-400 hover:shadow-[0_0_15px_rgba(251,146,60,0.1)]' :
                      isTop3 ? 'border-orange-300/30 bg-orange-300/5 hover:border-orange-300 hover:shadow-[0_0_15px_rgba(253,186,116,0.1)]' :
                      'border-border/50 hover:border-primary/50 hover:bg-muted/30'
                    }`}>
                      <div className={`flex flex-col items-start justify-start font-black text-xl shrink-0 ${
                        isTop1 ? 'text-orange-500' :
                        isTop2 ? 'text-orange-400' :
                        isTop3 ? 'text-orange-300' :
                        'text-muted-foreground/40'
                      }`}>
                        #{idx + 1}
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <h3 className="font-bold text-sm line-clamp-2 leading-tight mb-1 group-hover:text-primary transition-colors">{paper.title}</h3>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/50"></span>
                            <span className="line-clamp-1">{paper.authors?.[0] || 'Unknown'}</span>
                          </span>
                          <span className="text-xs font-bold text-orange-500 flex items-center gap-1 bg-orange-500/10 px-2 py-0.5 rounded-full group-hover:bg-orange-500/20 transition-colors shrink-0">
                            <Flame size={12} className={isTop1 ? "animate-pulse" : ""} /> {Math.round(paper.score) || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  )})}
                </div>
              )}
            </div>

            {/* Rising Topics */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-500/20 text-green-500 rounded-xl"><TrendingUp size={20} /></div>
                <h2 className="text-xl font-bold">Rising Topics</h2>
              </div>
              {isLoadingRising ? <Spinner /> : (
                <div className="space-y-4">
                  {risingData?.map((topic: any, idx: number) => {
                    const isPositive = !String(topic.growthRate).includes('-');
                    const isTop1 = idx === 0;
                    const isTop2 = idx === 1;
                    const isTop3 = idx === 2;

                    return (
                    <div key={idx} className={`group flex items-center justify-between p-3 rounded-xl border transition-all duration-300 hover:scale-[1.02] cursor-pointer ${
                      isTop1 ? 'border-green-500/50 bg-green-500/5 hover:border-green-500 hover:shadow-[0_0_15px_rgba(34,197,94,0.15)]' :
                      isTop2 ? 'border-green-400/40 bg-green-400/5 hover:border-green-400 hover:shadow-[0_0_15px_rgba(74,222,128,0.1)]' :
                      isTop3 ? 'border-green-300/30 bg-green-300/5 hover:border-green-300 hover:shadow-[0_0_15px_rgba(134,239,172,0.1)]' :
                      'border-transparent hover:border-border hover:bg-muted/30'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors shadow-sm ${
                          isTop1 ? 'bg-green-500/20 text-green-500' :
                          isTop2 ? 'bg-green-400/20 text-green-400' :
                          isTop3 ? 'bg-green-300/20 text-green-300' :
                          'bg-muted text-muted-foreground group-hover:text-primary group-hover:bg-background'
                        }`}>
                          {isTop1 ? <Rocket size={16} className="-mt-0.5" /> :
                           isTop2 ? <Sparkles size={16} /> :
                           isTop3 ? <Sparkles size={16} /> :
                           <Hash size={16} />}
                        </div>
                        <div className="flex flex-col">
                          <span className={`font-bold text-sm transition-colors ${
                            isTop1 ? 'text-green-500 drop-shadow-sm' :
                            isTop2 ? 'text-green-400 drop-shadow-sm' :
                            isTop3 ? 'text-green-300 drop-shadow-sm' :
                            'group-hover:text-primary'
                          }`}>{topic.topic || topic.key || 'Unknown'}</span>
                          {(isTop1 || isTop2 || isTop3) && (
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                              Top #{idx + 1} Rising
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm transition-transform duration-300 group-hover:scale-105 ${
                        isPositive 
                          ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                          : 'bg-red-500/10 text-red-500 border border-red-500/20'
                      }`}>
                        {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {isPositive ? '+' : ''}{topic.growthRate || '0%'}
                      </span>
                    </div>
                  )})}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm h-[400px]">
              <h2 className="text-xl font-bold mb-4">Topic Velocity</h2>
              {isLoadingVelocity ? <Spinner /> : (
                <div className="w-full h-full pb-8">
                  <ReactECharts 
                    option={{
                      tooltip: { trigger: 'axis' },
                      legend: { top: 'bottom' },
                      grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
                      xAxis: { type: 'category', boundaryGap: false, data: velocityData?.labels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'] },
                      yAxis: { type: 'value' },
                      series: velocityData?.series || [
                        { name: 'cs.AI', type: 'line', smooth: true, data: [120, 132, 101, 134, 90, 230] },
                        { name: 'cs.LG', type: 'line', smooth: true, data: [220, 182, 191, 234, 290, 330] }
                      ]
                    }} 
                    style={{ height: '100%', width: '100%' }} 
                  />
                </div>
              )}
            </div>
            
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm h-[400px]">
              <h2 className="text-xl font-bold mb-4">Trending Keywords Cloud</h2>
              {isLoadingCloud ? <Spinner /> : (
                <div className="w-full h-full pb-8">
                  <ReactECharts 
                    option={{
                      tooltip: { show: true },
                      series: [{
                        type: 'wordCloud',
                        shape: 'circle',
                        sizeRange: [12, 60],
                        rotationRange: [-90, 90],
                        gridSize: 8,
                        textStyle: {
                          fontFamily: 'sans-serif',
                          fontWeight: 'bold',
                          color: function () {
                            return 'rgb(' + [
                              Math.round(Math.random() * 160),
                              Math.round(Math.random() * 160),
                              Math.round(Math.random() * 160)
                            ].join(',') + ')';
                          }
                        },
                        data: wordCloudData || [
                          { name: 'Machine Learning', value: 1000 },
                          { name: 'Neural Networks', value: 800 },
                          { name: 'Deep Learning', value: 600 },
                          { name: 'Computer Vision', value: 400 },
                          { name: 'Transformers', value: 900 }
                        ]
                      }]
                    }} 
                    style={{ height: '100%', width: '100%' }} 
                  />
                </div>
              )}
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm h-[400px]">
              <h2 className="text-xl font-bold mb-4">Topic Activity Heatmap</h2>
              {isLoadingHeatmap ? <Spinner /> : (
                <div className="w-full h-full pb-8">
                  <ReactECharts 
                    option={{
                      tooltip: { position: 'top' },
                      grid: { height: '60%', top: '10%' },
                      xAxis: { type: 'category', data: heatmapData?.xLabels || ['cs.AI', 'cs.CV', 'cs.CL', 'cs.LG', 'cs.NE'], splitArea: { show: true } },
                      yAxis: { type: 'category', data: heatmapData?.yLabels || ['cs.AI', 'cs.CV', 'cs.CL', 'cs.LG', 'cs.NE'], splitArea: { show: true } },
                      visualMap: { min: 0, max: 100, calculable: true, orient: 'horizontal', left: 'center', bottom: '0%' },
                      series: [{
                        name: 'Co-occurrence',
                        type: 'heatmap',
                        data: heatmapData?.data || [[0,0,50], [0,1,20], [1,0,20], [1,1,80]],
                        label: { show: true },
                        emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' } }
                      }]
                    }} 
                    style={{ height: '100%', width: '100%' }} 
                  />
                </div>
              )}
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm h-[400px]">
              <h2 className="text-xl font-bold mb-4">Topic Race</h2>
              {isLoadingRace ? <Spinner /> : (
                <div className="w-full h-full pb-8">
                  <ReactECharts 
                    option={{
                      xAxis: { max: 'dataMax' },
                      yAxis: { type: 'category', data: raceData?.labels || ['cs.AI', 'cs.LG', 'cs.CV', 'cs.CL'], inverse: true, animationDuration: 300, animationDurationUpdate: 300 },
                      series: [{
                        realtimeSort: true,
                        name: 'Race',
                        type: 'bar',
                        data: raceData?.values || [120, 200, 150, 80],
                        label: { show: true, position: 'right', valueAnimation: true },
                        itemStyle: {
                          color: function(param: any) {
                            const colors = ['#CAFF33', '#68a6fc', '#e05cf8', '#fa6620'];
                            return colors[param.dataIndex % colors.length];
                          }
                        }
                      }],
                      animationDuration: 0,
                      animationDurationUpdate: 3000,
                      animationEasing: 'linear',
                      animationEasingUpdate: 'linear'
                    }} 
                    style={{ height: '100%', width: '100%' }} 
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaderboardPage;
