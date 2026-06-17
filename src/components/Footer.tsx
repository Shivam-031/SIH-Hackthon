import React from 'react';
import { MapPin, Phone, Mail, Headphones } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-card border-t py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center">
              <MapPin className="h-6 w-6 text-primary mr-2" />
              <span className="text-xl font-bold">CivicConnect</span>
            </div>
            <p className="text-muted-foreground text-sm">
              Building better communities through technology and civic engagement. 
              Connect with your local government and make your voice heard.
            </p>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Us</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-sm text-muted-foreground">+91 98765 43210</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">support@civicconnect.in</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Headphones className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">Civil Helpline</p>
                  <p className="text-sm text-muted-foreground">1800-123-4567</p>
                </div>
              </div>
            </div>
          </div>

          {/* Support & Help */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Support</h3>
            <div className="space-y-2">
              <a href="#" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Help Center
              </a>
              <a href="#" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Terms of Service
              </a>
              <a href="#" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                FAQ
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t mt-8 pt-8">
          <div className="text-sm text-muted-foreground text-center md:text-left">
            © 2024 CivicConnect. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;