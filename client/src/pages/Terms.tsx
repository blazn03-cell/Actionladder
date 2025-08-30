export default function Terms() {
  return (
    <div className="min-h-screen bg-felt-dark text-white font-sans">
      <div className="fixed inset-0 bg-felt-texture opacity-90 pointer-events-none"></div>
      <div className="fixed inset-0 bg-smoky opacity-40 pointer-events-none"></div>
      
      <div className="relative z-10 py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl font-bold text-white mb-8 text-center">Terms of Service</h1>
          
          <div className="bg-black/60 backdrop-blur-sm border border-neon-green/20 rounded-xl p-8 shadow-felt">
            <div className="space-y-6 text-gray-300">
              <section>
                <h2 className="text-2xl font-bold text-neon-green mb-4">Service Description</h2>
                <p>
                  Our service provides B2B league & tournament management software for pool halls.
                  This platform facilitates skill-based competitions only. No gambling or wagering is permitted.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-neon-green mb-4">Access and Usage</h2>
                <p>
                  Access is granted upon successful payment verification. 
                  Misuse of the platform, including but not limited to cheating, harassment, 
                  or attempts to manipulate standings may result in immediate suspension.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-neon-green mb-4">Liability</h2>
                <p>
                  Our liability is limited to fees paid in the last 3 months. 
                  The platform is provided "as is" without warranties of any kind.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-neon-green mb-4">Modifications</h2>
                <p>
                  We reserve the right to modify these terms at any time. 
                  Continued use of the service constitutes acceptance of modified terms.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}