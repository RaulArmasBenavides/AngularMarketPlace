import { Directive, ElementRef, HostListener, Input, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appStickyHeader]',
  standalone: true
})
export class StickyHeaderDirective {
  @Input() stickyThreshold: number = 50;

  constructor(
    private readonly elRef: ElementRef,
    private readonly renderer: Renderer2
  ) {}

  @HostListener('window:scroll')
  onWindowScroll(): void {
    const scrollTop = window.scrollY;
    const isSticky = scrollTop > this.stickyThreshold;

    if (isSticky) {
      this.renderer.addClass(this.elRef.nativeElement, 'header--sticky');
    } else {
      this.renderer.removeClass(this.elRef.nativeElement, 'header--sticky');
    }
  }
}
