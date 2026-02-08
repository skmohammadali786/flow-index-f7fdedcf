import React, { forwardRef } from 'react';
import { format } from 'date-fns';
import {
  PdfData,
  calculateInsights,
  calculateSummaryData,
  phaseStyles,
  colors
} from '@/utils/partnerSharePdf';
import { moodLabels, symptomLabels, getPhaseInfoForPdf } from '@/data/phaseData';

// Helper to convert color array to CSS string
const toRgb = (color: [number, number, number], opacity = 1) =>
  `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${opacity})`;

export const PartnerSharePdfTemplate = forwardRef<HTMLDivElement, { data: PdfData }>(({ data }, ref) => {
  const insights = calculateInsights(data.logs);
  const summaryData = calculateSummaryData(data.logs);
  const currentPhaseData = getPhaseInfoForPdf(data.currentPhase);
  const phaseStyle = phaseStyles[data.currentPhase];

  return (
    <div
      ref={ref}
      className="bg-white text-[#1e1b4b] font-sans relative overflow-hidden box-border"
      style={{ width: '794px', minHeight: '1123px', padding: '40px' }} // A4 size
    >
      {/* Background Decorations */}
      <div className="absolute top-[-20px] right-[-20px] w-40 h-40 rounded-full opacity-10" style={{ backgroundColor: toRgb(colors.lavender) }} />
      <div className="absolute top-1/2 left-[-30px] w-30 h-30 rounded-full opacity-10" style={{ backgroundColor: toRgb(colors.coral) }} />
      <div className="absolute bottom-10 right-[-20px] w-24 h-24 rounded-full opacity-10" style={{ backgroundColor: toRgb(colors.sage) }} />

      {/* Header */}
      <div className="rounded-2xl p-6 mb-8 relative overflow-hidden text-white" style={{ background: `linear-gradient(135deg, ${toRgb(colors.primary)} 0%, ${toRgb(colors.lavender)} 100%)` }}>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">💐 Cycle Update</h1>
          <p className="text-lg opacity-90">A personal wellness report for your partner</p>
          <div className="absolute top-6 right-6 text-right">
            <p className="text-sm font-medium opacity-90">{format(new Date(), 'MMMM d, yyyy')}</p>
            <p className="text-xs opacity-75">Flow Index</p>
          </div>
        </div>
        {/* Decorative circles in header */}
        <div className="absolute top-4 right-20 flex gap-3 opacity-20">
          {[1,2,3,4,5].map(i => (
             <div key={i} className="rounded-full bg-white" style={{ width: 4 + i, height: 4 + i }} />
          ))}
        </div>
      </div>

      {/* Current Phase Hero Card */}
      {data.shareSettings.showCurrentPhase && (
        <div className="rounded-2xl p-6 mb-8 flex items-center gap-6 border-l-8 shadow-sm" style={{ backgroundColor: toRgb(phaseStyle.lightColor), borderColor: toRgb(phaseStyle.color) }}>
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-4xl shadow-sm">
              {phaseStyle.icon}
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-1">{currentPhaseData.title}</h2>
              <p className="text-gray-600 italic mb-2">{currentPhaseData.subtitle}</p>
              <div className="flex gap-4 text-sm font-medium">
                 {data.currentCycleDay && <span>Day {data.currentCycleDay} of cycle</span>}
                 {data.daysUntilNextPeriod !== null && <span>• {data.daysUntilNextPeriod} days until next period</span>}
              </div>
            </div>
        </div>
      )}

      {/* Predictions Card */}
      {data.shareSettings.showPeriodDates && data.predictions && (
        <div className="rounded-2xl border p-6 mb-8 shadow-sm bg-white" style={{ borderColor: toRgb(colors.border) }}>
          <h3 className="text-xl font-bold mb-4">📅 Upcoming Dates</h3>
          <div className="flex gap-4">
             <div className="px-4 py-2 rounded-lg flex-1" style={{ backgroundColor: toRgb(colors.coralLight) }}>
                <span className="font-semibold">🩸 Period:</span> {format(new Date(data.predictions.nextPeriodStart), 'MMM d')} - {format(new Date(data.predictions.nextPeriodEnd), 'MMM d')}
             </div>
             {data.shareSettings.showFertileWindow && (
               <div className="px-4 py-2 rounded-lg flex-1" style={{ backgroundColor: toRgb(colors.lavenderLight) }}>
                  <span className="font-semibold">🌸 Fertile:</span> {format(new Date(data.predictions.fertileWindowStart), 'MMM d')} - {format(new Date(data.predictions.fertileWindowEnd), 'MMM d')}
               </div>
             )}
          </div>
        </div>
      )}

      {/* Quick Stats Grid */}
      <h3 className="text-xl font-bold mb-4">📊 This Week at a Glance</h3>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Days Logged', value: `${insights.daysLogged}/7`, icon: '📝', color: colors.lavenderLight },
          { label: 'Avg Sleep', value: insights.avgSleep ? `${insights.avgSleep}h` : '—', icon: '😴', color: colors.sageLight },
          { label: 'Avg Water', value: insights.avgWater ? `${insights.avgWater}` : '—', icon: '💧', color: colors.coralLight },
        ].map((stat, i) => (
          <div key={i} className="rounded-2xl p-4 flex flex-col justify-between h-28" style={{ backgroundColor: toRgb(stat.color) }}>
             <div className="text-2xl">{stat.icon}</div>
             <div className="flex justify-between items-end">
                <span className="text-2xl font-bold">{stat.value}</span>
                <span className="text-xs text-gray-600 font-medium">{stat.label}</span>
             </div>
          </div>
        ))}
      </div>

      {/* Mood Patterns */}
      {data.shareSettings.showMoodInsights && insights.topMoods.length > 0 && (
         <div className="rounded-2xl border p-6 mb-8 bg-white" style={{ borderColor: toRgb(colors.border) }}>
            <h3 className="text-xl font-bold mb-4">💭 Mood Patterns</h3>
            <div className="space-y-4">
               {insights.topMoods.map((moodData) => {
                 const moodInfo = moodLabels[moodData.mood];
                 const maxCount = Math.max(...insights.topMoods.map(m => m.count));
                 const percentage = (moodData.count / maxCount) * 100;
                 return (
                   <div key={moodData.mood}>
                      <div className="flex justify-between text-sm mb-1">
                         <span>{moodInfo.emoji} {moodInfo.label}</span>
                         <span className="text-gray-500">{moodData.count}×</span>
                      </div>
                      <div className="h-2 rounded-full w-full bg-gray-100 overflow-hidden">
                         <div className="h-full rounded-full" style={{ width: `${percentage}%`, backgroundColor: toRgb(colors.lavender) }} />
                      </div>
                   </div>
                 );
               })}
            </div>
         </div>
      )}

      {/* Symptom Patterns */}
      {data.shareSettings.showSymptomInsights && insights.topSymptoms.length > 0 && (
         <div className="rounded-2xl border p-6 mb-8 bg-white" style={{ borderColor: toRgb(colors.border) }}>
            <h3 className="text-xl font-bold mb-4">🩺 Symptom Tracker</h3>
            <div className="space-y-4">
               {insights.topSymptoms.map((symptomData) => {
                 const symptomInfo = symptomLabels[symptomData.symptom];
                 const maxCount = Math.max(...insights.topSymptoms.map(s => s.count));
                 const percentage = (symptomData.count / maxCount) * 100;
                 return (
                   <div key={symptomData.symptom}>
                      <div className="flex justify-between text-sm mb-1">
                         <span>{symptomInfo.emoji} {symptomInfo.label}</span>
                         <span className="text-gray-500">{symptomData.count}×</span>
                      </div>
                      <div className="h-2 rounded-full w-full bg-gray-100 overflow-hidden">
                         <div className="h-full rounded-full" style={{ width: `${percentage}%`, backgroundColor: toRgb(colors.coral) }} />
                      </div>
                   </div>
                 );
               })}
            </div>
         </div>
      )}

      {/* Summary */}
      <h3 className="text-xl font-bold mb-4">📈 Summary</h3>
      <div className="grid grid-cols-2 gap-6 mb-8">
         <div className="rounded-2xl p-6" style={{ backgroundColor: toRgb(colors.sageLight) }}>
            <h4 className="font-bold mb-4 text-lg">This Week</h4>
            <div className="space-y-2 text-sm">
               <p>📝 {summaryData.weekly.daysLogged} days logged</p>
               <p>🩸 {summaryData.weekly.periodDays} period days</p>
               {summaryData.weekly.topMood && (
                 <p>{moodLabels[summaryData.weekly.topMood].emoji} Most common: {moodLabels[summaryData.weekly.topMood].label}</p>
               )}
            </div>
         </div>
         <div className="rounded-2xl p-6" style={{ backgroundColor: toRgb(colors.lavenderLight) }}>
            <h4 className="font-bold mb-4 text-lg">This Month</h4>
            <div className="space-y-2 text-sm">
               <p>📝 {summaryData.monthly.daysLogged} days logged</p>
               <p>😴 Avg sleep: {summaryData.monthly.avgSleep || '—'}h</p>
               <p>💧 Avg water: {summaryData.monthly.avgWater || '—'} glasses</p>
            </div>
         </div>
      </div>

       {/* Cycle Stats */}
       {data.stats && (
         <div className="rounded-2xl border p-6 mb-8 bg-white" style={{ borderColor: toRgb(colors.border) }}>
            <h3 className="text-xl font-bold mb-6">🔄 Cycle Statistics</h3>
            <div className="grid grid-cols-4 gap-4 text-center">
               {[
                 { label: 'Avg Cycle', value: `${data.stats.averageCycleLength}d` },
                 { label: 'Avg Period', value: `${data.stats.averagePeriodLength}d` },
                 { label: 'Tracked', value: `${data.stats.totalCycles}` },
                 { label: 'Range', value: `${data.stats.shortestCycle}-${data.stats.longestCycle}d` },
               ].map((stat, i) => (
                  <div key={i}>
                     <p className="text-2xl font-bold mb-1" style={{ color: toRgb(colors.primary) }}>{stat.value}</p>
                     <p className="text-xs text-gray-500">{stat.label}</p>
                  </div>
               ))}
            </div>
         </div>
       )}

       {/* Partner Tips */}
       {data.shareSettings.showMoodTips && (
          <div className="rounded-2xl p-6 mb-8 border-l-8" style={{ backgroundColor: toRgb(colors.lavenderLight), borderColor: toRgb(colors.primary) }}>
             <h3 className="text-xl font-bold mb-4">💝 How You Can Help</h3>
             <ul className="space-y-3">
                {currentPhaseData.tips.map((tip, i) => (
                   <li key={i} className="flex items-start gap-3 text-sm">
                      <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: toRgb(colors.primary) }} />
                      <span>{tip}</span>
                   </li>
                ))}
             </ul>
          </div>
       )}

       {/* Footer */}
       <div className="mt-auto pt-6 border-t border-gray-200 text-center relative">
          <p className="text-xs text-gray-400 italic mb-1">Generated with love from Flow Index</p>
          <p className="text-xs text-gray-400 italic">This report is for personal wellness tracking and partner communication only.</p>
          <div className="absolute left-0 bottom-0 text-xl">💜</div>
          <div className="absolute right-0 bottom-0 text-xl">💜</div>
       </div>

    </div>
  );
});

PartnerSharePdfTemplate.displayName = 'PartnerSharePdfTemplate';
