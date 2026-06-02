import { Directive, ElementRef, OnInit, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appBackgroundImage]',
  standalone: true
})
export class BackgroundImageDirective implements OnInit {
  constructor(
    private readonly elRef: ElementRef,
    private readonly renderer: Renderer2
  ) {}

  ngOnInit(): void {
    const elements = this.elRef.nativeElement.querySelectorAll('[data-background]');
    elements.forEach((el: HTMLElement) => {
      const bg = el.getAttribute('data-background');
      if (bg) {
        this.renderer.setStyle(el, 'background-image', `url(${bg})`);
        this.renderer.setStyle(el, 'background-size', 'cover');
        this.renderer.setStyle(el, 'background-position', 'center');
      }
    });
  }
}
