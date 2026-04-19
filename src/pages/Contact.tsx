import Layout from "@/components/layout/Layout";
import { ArrowLeft, Phone, Mail, MapPin, Send } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log("Form submitted:", formData);
    setFormData({ name: "", email: "", phone: "", message: "" });
    alert("Thank you for your message! We'll get back to you soon.");
  };

  return (
    <Layout>
      <section className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground section-padding">
        <div className="container-main">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
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
                      <Phone className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">Phone</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-3">Call us directly for immediate assistance</p>
                  <a href="tel:+916309835752" className="text-primary font-semibold hover:underline text-lg">
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
                        value={formData.name}
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
                        value={formData.email}
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
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+91 XXXXX XXXXX"
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Message</label>
                      <textarea
                        name="message"
                        value={formData.message}
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
