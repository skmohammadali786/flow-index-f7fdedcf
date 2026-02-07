import { motion } from 'framer-motion';
import { ArrowLeft, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import logo from '@/assets/logo.jpg';

const Privacy = () => {
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
          <Link to="/auth">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
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
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-2xl font-display">Privacy Policy</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground mt-2">Last updated: February 7, 2026</p>
            </CardHeader>

            <CardContent className="space-y-6 text-sm leading-relaxed text-muted-foreground">
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-3">1. Introduction</h2>
                <p>
                  At Flow Index, we take your privacy seriously. This Privacy Policy explains how we collect, 
                  use, disclose, and safeguard your information when you use our menstrual cycle tracking 
                  application. Please read this policy carefully.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-foreground mb-3">2. Information We Collect</h2>
                <p className="mb-2">We collect information that you provide directly to us, including:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Account information (email address, name)</li>
                  <li>Menstrual cycle data (period dates, flow intensity)</li>
                  <li>Health data (symptoms, moods, temperature, sleep)</li>
                  <li>Settings and preferences</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-foreground mb-3">3. How We Use Your Information</h2>
                <p className="mb-2">We use the information we collect to:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Provide and maintain the App's functionality</li>
                  <li>Generate cycle predictions and personalized insights</li>
                  <li>Send you notifications and reminders (if enabled)</li>
                  <li>Improve and optimize the App</li>
                  <li>Respond to your requests and support inquiries</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-foreground mb-3">4. Data Security</h2>
                <p>
                  We implement appropriate technical and organizational security measures to protect your 
                  personal data against unauthorized access, alteration, disclosure, or destruction. Your 
                  health data is encrypted both in transit and at rest.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-foreground mb-3">5. Data Sharing</h2>
                <p>
                  We do not sell, trade, or rent your personal health data to third parties. We may share 
                  information only in the following circumstances:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>With your explicit consent</li>
                  <li>To comply with legal obligations</li>
                  <li>To protect our rights and safety</li>
                  <li>With service providers who assist in operating the App (under strict confidentiality)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-foreground mb-3">6. Your Rights</h2>
                <p className="mb-2">You have the right to:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Access your personal data</li>
                  <li>Correct inaccurate data</li>
                  <li>Request deletion of your data</li>
                  <li>Export your data in a portable format</li>
                  <li>Withdraw consent at any time</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-foreground mb-3">7. Data Retention</h2>
                <p>
                  We retain your personal data for as long as your account is active or as needed to provide 
                  you services. You may request deletion of your account and associated data at any time 
                  through the App settings.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-foreground mb-3">8. Children's Privacy</h2>
                <p>
                  The App is not intended for children under 13 years of age. We do not knowingly collect 
                  personal information from children under 13. If you are a parent or guardian and believe 
                  your child has provided us with personal information, please contact us.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-foreground mb-3">9. Changes to This Policy</h2>
                <p>
                  We may update this Privacy Policy from time to time. We will notify you of any changes by 
                  posting the new Privacy Policy on this page and updating the "Last updated" date.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-foreground mb-3">10. Contact Us</h2>
                <p>
                  If you have any questions about this Privacy Policy or our data practices, please contact 
                  us through the App's support channels.
                </p>
              </section>

              <div className="pt-4 border-t border-border">
                <Link to="/auth">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Sign Up
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Privacy;
