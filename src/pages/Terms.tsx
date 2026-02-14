import { motion } from 'framer-motion';
import { ArrowLeft, FileText } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import logo from '@/assets/logo.png';

const Terms = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleBack = () => {
    if (user) {
      navigate('/');
    } else {
      navigate('/auth');
    }
  };

  return (
    <div className="min-h-screen gradient-soft py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-4 mb-8"
        >
          <Button variant="ghost" size="icon" className="rounded-full" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm">
              <img src={logo} alt="Flow Index" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground">Flow Index</h1>
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="border-border/50 shadow-elevated bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-2xl font-display">Terms of Service</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground mt-2">Last updated: February 7, 2026</p>
            </CardHeader>

            <CardContent className="space-y-6 text-sm leading-relaxed text-muted-foreground">
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
                <p>
                  By accessing or using Flow Index ("the App"), you agree to be bound by these Terms of Service. 
                  If you do not agree to these terms, please do not use the App.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-foreground mb-3">2. Description of Service</h2>
                <p>
                  Flow Index is a menstrual cycle tracking application designed to help users monitor their 
                  menstrual cycles, symptoms, moods, and related health information. The App provides cycle 
                  predictions, health insights, and personalized recommendations based on user-entered data.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-foreground mb-3">3. Medical Disclaimer</h2>
                <p>
                  The information provided by Flow Index is for informational purposes only and is not intended 
                  as a substitute for professional medical advice, diagnosis, or treatment. Always seek the 
                  advice of your physician or other qualified health provider with any questions you may have 
                  regarding a medical condition.
                </p>
                <p className="mt-2">
                  The App's predictions and insights are based on algorithms and user-entered data. They should 
                  not be used as the sole basis for making health-related decisions, including but not limited 
                  to contraception or fertility planning.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-foreground mb-3">4. User Accounts</h2>
                <p>
                  You are responsible for maintaining the confidentiality of your account credentials and for 
                  all activities that occur under your account. You agree to notify us immediately of any 
                  unauthorized use of your account.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-foreground mb-3">5. User Data</h2>
                <p>
                  You retain ownership of all data you enter into the App. By using the App, you grant us a 
                  limited license to store, process, and display your data solely for the purpose of providing 
                  the service to you.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-foreground mb-3">6. Prohibited Uses</h2>
                <p>You agree not to:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Use the App for any illegal purpose</li>
                  <li>Attempt to gain unauthorized access to the App or its systems</li>
                  <li>Interfere with or disrupt the App's functionality</li>
                  <li>Share your account credentials with others</li>
                  <li>Use the App to transmit harmful content</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-foreground mb-3">7. Intellectual Property</h2>
                <p>
                  The App and its original content, features, and functionality are owned by Flow Index and 
                  are protected by international copyright, trademark, patent, trade secret, and other 
                  intellectual property laws.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-foreground mb-3">8. Limitation of Liability</h2>
                <p>
                  To the maximum extent permitted by law, Flow Index shall not be liable for any indirect, 
                  incidental, special, consequential, or punitive damages, including without limitation, 
                  loss of profits, data, use, goodwill, or other intangible losses.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-foreground mb-3">9. Changes to Terms</h2>
                <p>
                  We reserve the right to modify these terms at any time. We will notify users of any material 
                  changes by posting the new terms on this page and updating the "Last updated" date.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-foreground mb-3">10. Contact Us</h2>
                <p>
                  If you have any questions about these Terms of Service, please contact us through the App's 
                  support channels.
                </p>
              </section>

              <div className="pt-4 border-t border-border">
                <Button variant="outline" className="w-full" onClick={handleBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {user ? 'Back to App' : 'Back to Sign Up'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Terms;
