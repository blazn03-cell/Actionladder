export default function AcceptableUse() {
  return (
    <div className="min-h-screen bg-felt-dark text-white font-sans">
      <div className="fixed inset-0 bg-felt-texture opacity-90 pointer-events-none"></div>
      <div className="fixed inset-0 bg-smoky opacity-40 pointer-events-none"></div>
      
      <div className="relative z-10 py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl font-bold text-white mb-8 text-center">Acceptable Use Policy</h1>
          
          <div className="bg-black/60 backdrop-blur-sm border border-neon-green/20 rounded-xl p-8 shadow-felt">
            <div className="space-y-6 text-gray-300">
              <section>
                <h2 className="text-2xl font-bold text-neon-green mb-4">Prohibited Conduct</h2>
                <ul className="space-y-3 list-disc list-inside">
                  <li>No harassment, threatening behavior, or personal attacks against other players</li>
                  <li>No cheating, score manipulation, or attempts to exploit system vulnerabilities</li>
                  <li>No attempts to manipulate standings, payout logic, or tournament results</li>
                  <li>No use of automated scripts, bots, or other artificial means to gain unfair advantage</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-neon-green mb-4">Gambling Restrictions</h2>
                <p>
                  This platform does not facilitate gambling, betting, or wagering of any kind. 
                  No gambling, odds calculation, or wagers may be conducted via this platform. 
                  All competitions are skill-based tournaments with predetermined entry fees and prize structures.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-neon-green mb-4">Fair Play</h2>
                <p>
                  All players must compete fairly and honestly. Match results must be reported accurately. 
                  Any suspicion of match fixing, collusion, or other unfair practices will result in 
                  immediate investigation and potential account suspension.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-neon-green mb-4">Community Standards</h2>
                <p>
                  Maintain respectful communication in all platform interactions. 
                  Inappropriate language, discriminatory remarks, or unsportsmanlike conduct 
                  violates our community standards and may result in penalties.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-neon-green mb-4">Enforcement</h2>
                <p>
                  Violations of this policy may result in warnings, temporary suspension, 
                  or permanent account termination depending on severity. 
                  We reserve the right to investigate any suspected violations.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}