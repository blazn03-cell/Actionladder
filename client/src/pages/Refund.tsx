export default function Refund() {
  return (
    <div className="min-h-screen bg-felt-dark text-white font-sans">
      <div className="fixed inset-0 bg-felt-texture opacity-90 pointer-events-none"></div>
      <div className="fixed inset-0 bg-smoky opacity-40 pointer-events-none"></div>
      
      <div className="relative z-10 py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl font-bold text-white mb-8 text-center">Refund Policy</h1>
          
          <div className="bg-black/60 backdrop-blur-sm border border-neon-green/20 rounded-xl p-8 shadow-felt">
            <div className="space-y-6 text-gray-300">
              <section>
                <h2 className="text-2xl font-bold text-neon-green mb-4">Subscription Refunds</h2>
                <p>
                  You may cancel your subscription at any time. Upon cancellation, 
                  you will retain access until the end of the current billing period. 
                  Prorations are handled per Stripe's billing settings.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-neon-green mb-4">Event Entry Refunds</h2>
                <p>
                  Tournament and event entries are refundable until bracket lock/cutoff time. 
                  After the bracket is locked, entries are non-refundable except in cases of 
                  system errors or technical issues on our end.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-neon-green mb-4">Deposit Refunds</h2>
                <p>
                  Deposits are refundable when attendance is validated or per operator decision. 
                  Refund processing typically takes 3-5 business days to appear on your original payment method.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-neon-green mb-4">Refund Process</h2>
                <p>
                  To request a refund, contact the tournament operator or use the automated 
                  refund options available in your account dashboard. All refunds are processed 
                  through Stripe and follow their standard refund timelines.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-neon-green mb-4">Exceptional Circumstances</h2>
                <p>
                  In cases of system errors, technical failures, or other exceptional circumstances 
                  beyond player control, we may issue full refunds at our discretion.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}