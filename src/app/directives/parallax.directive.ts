import { Directive, ElementRef, HostListener, OnInit, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appParallax]',
  standalone: true
})
export class ParallaxDirective implements OnInit {
  private readonly windowHeight = window.innerHeight;

  constructor(
    private readonly elRef: ElementRef,
    private readonly renderer: Renderer2
  ) {}

  ngOnInit(): void {
    if (this.isMobile()) {
      this.renderer.setStyle(this.elRef.nativeElement, 'backgroundAttachment', 'scroll');
    }
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (!this.isMobile()) {
      this.handleParallax(window.scrollY);
    }
  }

  private handleParallax(scrollTop: number): void {
    const rect = this.elRef.nativeElement.getBoundingClientRect();
    const elementTop = rect.top + scrollTop;
    const elementHeight = rect.height;

    if (elementTop + elementHeight < scrollTop || elementTop > scrollTop + this.windowHeight) {
      return;
    }

    const yPos = Math.round((elementTop - scrollTop) * 0.2);
    this.renderer.setStyle(this.elRef.nativeElement, 'backgroundPosition', `50% ${yPos}px`);
  }

  private isMobile(): boolean {
    return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(navigator.userAgent);
  }
}
