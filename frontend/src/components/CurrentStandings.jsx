import { useMemo, useCallback, memo } from 'react';
import { useApp } from '../context/AppContext';
import { atlanticTeams } from '../data/teams';
import TeamLogo from './TeamLogo';

const CurrentStandings = memo(() => {
  const { standings } = useApp();

  const getTeamColor = useCallback((teamName) => {
    const team = atlanticTeams.find(t => t.name === teamName);
    return team?.primaryColor || '#2C3E50';
  }, []);

  const getMedalEmoji = useCallback((rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  }, []);

  return (
    <div className="modern-card overflow-hidden card-3d h-full flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-deepNavy via-blue-900 to-purple-900 px-6 py-6 border-b border-white/10 relative overflow-hidden flex-shrink-0">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
        <div className="relative flex items-center gap-4 mb-2">
          <div className="w-14 h-14 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-lg">
            <span className="text-3xl">📊</span>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl md:text-3xl font-black text-white" style={{fontFamily: 'Poppins, sans-serif'}}>
              Current Standings
            </h2>
            <p className="text-sm text-gray-300 font-medium">Drag teams → to your predictions</p>
          </div>
        </div>
      </div>
      
      <div className="p-6 flex-1 overflow-y-auto">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-4 px-3 text-xs md:text-sm font-bold text-gray-600 uppercase tracking-wider">Rank</th>
                <th className="text-left py-4 px-4 text-xs md:text-sm font-bold text-gray-600 uppercase tracking-wider">Team</th>
                <th className="text-center py-4 px-2 text-xs md:text-sm font-bold text-gray-600 uppercase tracking-wider">GP</th>
                <th className="text-center py-4 px-2 text-xs md:text-sm font-bold text-gray-600 uppercase tracking-wider">W</th>
                <th className="text-center py-4 px-2 text-xs md:text-sm font-bold text-gray-600 uppercase tracking-wider">L</th>
                <th className="text-center py-4 px-2 text-xs md:text-sm font-bold text-gray-600 uppercase tracking-wider hidden md:table-cell">OTL</th>
                <th className="text-center py-4 px-3 text-xs md:text-sm font-bold text-gray-600 uppercase tracking-wider">PTS</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((standing, index) => {
                const rank = index + 1;
                const medal = getMedalEmoji(rank);
                const teamData = atlanticTeams.find(t => t.name === standing.team);
                return (
                  <tr
                    key={standing.team}
                    draggable={teamData ? true : false}
                    onDragStart={(e) => {
                      if (teamData) {
                        e.stopPropagation();
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.setData('text/plain', '');
                        e.dataTransfer.setData('teamId', teamData.id);
                        e.dataTransfer.setData('teamName', teamData.name);
                        e.dataTransfer.setData('source', 'standings');
                        e.currentTarget.style.opacity = '0.5';
                        e.currentTarget.style.cursor = 'grabbing';
                        document.body.style.cursor = 'grabbing';
                      }
                    }}
                    onDragEnd={(e) => {
                      e.currentTarget.style.opacity = '1';
                      e.currentTarget.style.cursor = 'grab';
                      document.body.style.cursor = 'default';
                    }}
                    onDrag={(e) => {
                      e.currentTarget.style.opacity = '0.5';
                    }}
                    className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 transition-colors duration-150 group cursor-grab active:cursor-grabbing select-none"
                  >
                    <td className="py-4 px-3" draggable="false">
                      <div className="flex items-center gap-2">
                        {medal && <span className="text-xl">{medal}</span>}
                        <span className="text-xl md:text-2xl font-black text-gray-800" style={{fontFamily: 'Poppins, sans-serif'}}>
                          {rank}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                        <div className="flex items-center gap-4 group-hover:scale-[1.02] transition-transform duration-150">
                        {/* Team Logo */}
                        {teamData && (
                          <div className="flex-shrink-0">
                            <TeamLogo teamData={teamData} size="64px" />
                          </div>
                        )}
                        
                        {/* Team Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div 
                              className="w-1.5 h-8 rounded-full shadow-md flex-shrink-0"
                              style={{ backgroundColor: getTeamColor(standing.team) }}
                            ></div>
                            <div className="font-bold text-gray-800 text-sm md:text-base truncate">{standing.team}</div>
                            <span className="text-xs text-gray-400 ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                              👆 Drag me
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 font-medium ml-3.5">{standing.pts} points</div>
                        </div>
                      </div>
                    </td>
                    <td className="text-center py-4 px-2 text-gray-700 font-semibold text-sm md:text-base" draggable="false">{standing.gp}</td>
                    <td className="text-center py-4 px-2" draggable="false">
                      <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded-lg font-bold text-sm md:text-base">
                        {standing.w}
                      </span>
                    </td>
                    <td className="text-center py-4 px-2" draggable="false">
                      <span className="inline-block px-2 py-1 bg-red-100 text-red-800 rounded-lg font-bold text-sm md:text-base">
                        {standing.l}
                      </span>
                    </td>
                    <td className="text-center py-4 px-2 hidden md:table-cell" draggable="false">
                      <span className="inline-block px-2 py-1 bg-orange-100 text-orange-800 rounded-lg font-bold">
                        {standing.otl}
                      </span>
                    </td>
                    <td className="text-center py-4 px-3" draggable="false">
                      <span className="inline-block px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-black text-base md:text-lg shadow-lg" style={{fontFamily: 'Poppins, sans-serif'}}>
                        {standing.pts}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        <div className="mt-6 flex items-center justify-end gap-2 text-xs text-gray-500">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          <span className="font-medium">
            Updated: {standings[0]?.last_updated ? new Date(standings[0].last_updated).toLocaleDateString() : 'N/A'}
          </span>
        </div>
      </div>
    </div>
  );
});

CurrentStandings.displayName = 'CurrentStandings';

export default CurrentStandings;

