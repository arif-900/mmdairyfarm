import Layout from "@/components/layout/Layout";
import { ArrowLeft, Phone, Mail, MapPin, Send } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CircularBackButton } from "@/components/ui/CircularBackButton";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const Contact = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    switch (name) {
      case "name": setName(value); break;
      case "email": setEmail(value); break;
      case "phone": setPhone(value); break;
      case "message": setMessage(value); break;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    setName(""); setEmail(""); setPhone(""); setMessage("");
    alert("Thank you for your message! We'll get back to you soon.");
  };

  return (
    <Layout>
      <section className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground section-padding">
        <div className="container-main">
          <CircularBackButton 
            onClick={() => navigate("/")} 
            className="mb-8"
          />
          <div>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">Contact Us</h1>
            <p className="text-primary-foreground/90 text-lg max-w-2xl">
              Have questions? We'd love to hear from you. Get in touch with us today!
            </p>
          </div>
        </div>
      </section>

      <section className="section-padding bg-muted/30">
        <div className="container-main max-w-5xl">
          <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2 mb-12">
            {/* Contact Information */}
            <div className="space-y-6">
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-8">Get In Touch</h2>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-primary/10 p-3">
                      <svg className="w-6 h-6 text-primary fill-current" viewBox="0 0 24 24">
                        <path d="M12.012 2C6.48 2 2 6.48 2 12.01c0 1.77.46 3.49 1.34 5.02L2 22l5.12-1.34c1.47.8 3.12 1.22 4.88 1.22 5.53 0 10.01-4.48 10.01-10.01C22.01 6.48 17.54 2 12.012 2zm.04 17.3c-1.53 0-3.04-.41-4.36-1.19l-.31-.19-3.24.85.87-3.16-.21-.33c-.85-1.36-1.3-2.94-1.3-4.57 0-4.73 3.85-8.58 8.58-8.58 4.73 0 8.58 3.85 8.58 8.58 0 4.73-3.85 8.58-8.58 8.58zm4.72-6.43c-.26-.13-1.53-.76-1.77-.84-.23-.09-.4-.13-.57.13-.17.26-.66.84-.81 1.01-.15.17-.3.19-.56.06-.26-.13-1.11-.41-2.11-1.3-1.02-.91-1.71-2.03-1.91-2.37-.2-.34-.02-.53.11-.66.12-.12.26-.3.39-.45.13-.15.17-.26.26-.43.09-.17.04-.32-.02-.45-.06-.13-.57-1.37-.78-1.88-.2-.5-.4-.43-.57-.44-.15-.01-.32-.01-.49-.01-.17 0-.45.06-.68.32-.23.26-.88.86-.88 2.09 0 1.23.9 2.42 1.02 2.58.12.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.53-.62 1.75-1.2.22-.57.22-1.07.15-1.2-.07-.12-.26-.19-.52-.32z"/>
                      </svg>
                    </div>
                    <CardTitle className="text-xl">WhatsApp</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-3">Message us on WhatsApp for instant assistance</p>
                  <a href="https://wa.me/916309835752" target="_blank" rel="noopener noreferrer" className="text-primary font-semibold hover:underline text-lg">
                    +91 63098 35752
                  </a>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-primary/10 p-3">
                      <Mail className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">Email</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-3">Send us an email and we'll respond within 24 hours</p>
                  <a href="mailto:mmvalidairyfarm@gmail.com" className="text-primary font-semibold hover:underline text-lg">
                    mmvalidairyfarm@gmail.com
                  </a>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-primary/10 p-3">
                      <MapPin className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">Location</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-3">Visit us at our farm location</p>
                  <p className="font-semibold text-base mb-4">
                    MMVALI Dairy Farm<br />
                    Bhanakacherla, Bhanumukkala<br />
                    Andhra Pradesh 518422
                  </p>
                  <a
                    href="https://maps.app.goo.gl/X8PvVu5ZBitaye1P9"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-semibold transition-colors"
                  >
                    <MapPin className="w-4 h-4" />
                    View on Google Maps
                  </a>
                </CardContent>
              </Card>
            </div>

            {/* Contact Form */}
            <div>
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-8">Send us a Message</h2>

              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Name</label>
                      <Input
                        type="text"
                        name="name"
                        value={name}
                        onChange={handleChange}
                        placeholder="Your name"
                        required
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Email</label>
                      <Input
                        type="email"
                        name="email"
                        value={email}
                        onChange={handleChange}
                        placeholder="your@email.com"
                        required
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Phone</label>
                      <Input
                        type="tel"
                        name="phone"
                        value={phone}
                        onChange={handleChange}
                        placeholder="+91 XXXXX XXXXX"
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Message</label>
                      <textarea
                        name="message"
                        value={message}
                        onChange={handleChange}
                        placeholder="Tell us how we can help..."
                        required
                        rows={6}
                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                      />
                    </div>

                    <Button type="submit" className="w-full" size="lg">
                      <Send className="w-4 h-4 mr-2" />
                      Send Message
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Embedded Map */}
          <div className="mt-12">
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-6">Visit Us</h2>
            <Card className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d3840.123456789!2d78.53599649919123!3d15.804257823017718!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMTVwNDgnMTUuMyJOIDc4wrAzMicyMS42IkU!5e0!3m2!1sen!2sin!4v1741516000000"
                  width="100%"
                  height="450"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="MMVALI Dairy Farm Location"
                  className="w-full"
                ></iframe>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Contact;
