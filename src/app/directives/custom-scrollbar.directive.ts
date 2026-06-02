import { Directive, ElementRef, OnInit, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appCustomScrollbar]',
  standalone: true
})
export class CustomScrollbarDirective implements OnInit {
  constructor(
    private readonly elRef: ElementRef,
    private readonly renderer: Renderer2
  ) {}

  ngOnInit(): void {
    const elements = this.elRef.nativeElement.querySelectorAll('.ps-custom-scrollbar');

    elements.forEach((el: HTMLElement) => {
      const height = el.getAttribute('data-height');
      if (height) {
        this.renderer.setStyle(el, 'maxHeight', `${height}px`);
      }
    });
  }
}
