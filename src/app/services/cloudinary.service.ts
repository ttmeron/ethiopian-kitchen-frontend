import { HttpClient } from '@angular/common/http';
import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { Observable, fromEvent, of } from 'rxjs';
import { map } from 'rxjs/operators';


declare let cloudinary: any;
const WIDGET_URL = 'https://widget.cloudinary.com/v2.0/global/all.js';

@Injectable({
  providedIn: 'root'
})
export class CloudinaryService {

  private renderer: Renderer2;
  private cloudName = 'dx5emf7ln'; // Cloudinary cloud name
  private uploadPreset = 'ethiopian-kitchen'; 
  private apiUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`;


  constructor(
    rendererFactory: RendererFactory2,
    private http: HttpClient) {
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  uploadImage(file: File): Observable<any> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', this.uploadPreset);
  formData.append('cloud_name', this.cloudName);
  formData.append('folder', 'ethiopian-kitchen');

  return this.http.post(
    `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`,
    formData
  );
}
  // Create and open upload widget
  openUploadWidget(): Observable<any[]> {
    return new Observable(observer => {
      const uploadCallback = (error: any, result: any) => {
        if (error) {
          observer.error(error);
          return;
        }
        
        if (result && result.event === 'success') {
          observer.next(result.info);
        }
        
        if (result && result.event === 'queues-end') {
          observer.complete();
        }
      };

      const createWidget = () => {
        const widget = cloudinary.createUploadWidget(
          {
            cloudName: this.cloudName,
            uploadPreset: this.uploadPreset,
            sources: ['local', 'camera', 'url'],
            multiple: true,
            maxFiles: 10,
            folder: 'ethiopian-kitchen',
            styles: {
              palette: {
                window: '#FFFFFF',
                sourceBg: '#F5F5F5',
                windowBorder: '#E0E0E0',
                tabIcon: '#4CAF50',
                menuIcons: '#4CAF50',
                action: '#FF5722',
                inProgress: '#2196F3',
                complete: '#4CAF50'
              }
            }
          },
          uploadCallback
        );
        widget.open();
      };

      this.ensureWidgetScript().subscribe(() => {
        createWidget();
      });
    });
  }

  // Ensure the Cloudinary script is loaded
  private ensureWidgetScript(): Observable<Event> {
    if (this.isScriptLoaded(WIDGET_URL)) {
      return of(new Event('load'));
    }
    return this.loadScript();
  }

  private isScriptLoaded(url: string): boolean {
    return !!document.querySelector(`script[src="${url}"]`);
  }

  private loadScript(): Observable<Event> {
    const script = this.renderer.createElement('script');
    script.type = 'text/javascript';
    script.src = WIDGET_URL;
    this.renderer.appendChild(document.body, script);
    return fromEvent(script, 'load');
  }
}
