import { Component } from '@angular/core';
import { ContactService } from '../../services/contact.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-about-contact',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './about-contact.component.html',
  styleUrl: './about-contact.component.scss'
})
export class AboutContactComponent {

  activeTab: 'about' | 'contact' = 'about';
  isLoading = false;

  formData = {
    name: '',
    email: '',
    message: ''
  };

  constructor(private contactService: ContactService) {}

  storyMilestones = [
    {
      title: 'Family Beginnings',
      description: 'It all started in my home kitchen, cooking traditional Ethiopian meals for family and friends who fell in love with the authentic flavors.'
    },
    {
      title: 'Sharing with the World',
      description: 'Today, we welcome guests from all backgrounds to experience the warmth, community, and authentic flavors of Ethiopian dining.'
    }
  ];
  
 

   async onSubmit(event: Event) {
    event.preventDefault();
    
    // Basic validation
    if (!this.formData.name || !this.formData.email || !this.formData.message) {
      alert('Please fill in all required fields.');
      return;
    }
    
    this.isLoading = true;
    
    try {
      const success = await this.contactService.sendContactEmail(this.formData);
      
      if (success) {
        alert('✅ Thank you for your message! We will respond within 24 hours.');
        this.resetForm();
      } else {
        alert('❌ Sorry, there was an error sending your message. Please try again or call us.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ An error occurred. Please try again.');
    } finally {
      this.isLoading = false;
    }
  }
  resetForm(): void {
    this.formData = {
      name: '',
      email: '',
      message: ''
    };
  }

}
