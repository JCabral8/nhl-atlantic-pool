import { atlanticTeams } from '../data/teams';
import TeamLogo from './TeamLogo';

const TeamPills = ({ availableTeams, onDragStart }) => {
  const handleDragStart = (e, team) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('teamId', team.id);
    e.dataTransfer.setData('teamName', team.name);
    e.dataTransfer.setData('source', 'pills');
    if (onDragStart) onDragStart(team);
  };

  return (
    <div className="mt-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg">
          <span className="text-2xl">🏒</span>
        </div>
        <div>
          <h3 className="text-xl md:text-2xl font-black text-gray-800" style={{fontFamily: 'Poppins, sans-serif'}}>
            Available Teams
          </h3>
          <p className="text-sm text-gray-500 font-medium">
            Drag to your prediction slots above
          </p>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-4">
        {availableTeams.map((team) => {
          const teamData = atlanticTeams.find(t => t.id === team);
          if (!teamData) return null;
          
          return (
            <div
              key={teamData.id}
              draggable
              onDragStart={(e) => handleDragStart(e, teamData)}
              className="group relative team-pill cursor-grab active:cursor-grabbing shine-effect"
              style={{ 
                background: teamData.gradient,
                color: 'white',
              }}
            >
              {/* Logo Container */}
              <div className="flex items-center gap-3">
                <TeamLogo teamData={teamData} size="64px" />
                
                {/* Team Info */}
                <div className="relative z-10">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black tracking-wide" style={{fontFamily: 'Poppins, sans-serif'}}>
                      {teamData.abbreviation}
                    </span>
                    <div className="w-1.5 h-1.5 bg-white rounded-full opacity-60"></div>
                  </div>
                  <div className="text-xs font-semibold opacity-90 mt-0.5">
                    {teamData.name.split(' ').pop()}
                  </div>
                </div>
              </div>

              {/* Drag Indicator */}
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-110">
                <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </div>

              {/* Hover Glow */}
              <div 
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl -z-10"
                style={{
                  background: teamData.gradient,
                  filter: 'blur(20px)',
                }}
              ></div>
            </div>
          );
        })}
      </div>
      
      {availableTeams.length === 0 && (
        <div className="modern-card p-8 text-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-2 border-green-300">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-xl">
            <span className="text-5xl">✅</span>
          </div>
          <p className="text-2xl font-black text-green-800 mb-2" style={{fontFamily: 'Poppins, sans-serif'}}>
            All Teams Placed!
          </p>
          <p className="text-base text-green-700 font-medium">
            Ready to submit your predictions 🏆
          </p>
        </div>
      )}
    </div>
  );
};

export default TeamPills;

