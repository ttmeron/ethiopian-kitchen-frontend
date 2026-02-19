
import { Injectable } from '@angular/core';
import emailjs from '@emailjs/browser';

export interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  private readonly EMAILJS_CONFIG = {
    serviceId: 'service_v6mn3av',     
    templateId: 'template_qok2ops',   
   
    publicKey: 'qihbm6mEMS7kKoUE_'  
  };

  constructor() {
    emailjs.init(this.EMAILJS_CONFIG.publicKey);
  }

  async sendContactEmail(formData: ContactFormData): Promise<{ success: boolean; message: string }> {
    try {
      const templateParams = {
        from_name: formData.name,
        from_email: formData.email,
        message: formData.message,
        to_email: 'info@ethiopiankitchen.com',
        reply_to: formData.email,
        date: new Date().toLocaleString()
      };

      const response = await emailjs.send(
        this.EMAILJS_CONFIG.serviceId,
        this.EMAILJS_CONFIG.templateId,
        templateParams
      );

      console.log('Email sent successfully:', response);
      return { success: true, message: 'Email sent successfully!' };
      
    } catch (error) {
      console.error('Email sending failed:', error);
      return { 
        success: false, 
        message: 'Failed to send email. Please try again later.' 
      };
    }
  }
}