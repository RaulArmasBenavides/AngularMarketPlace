import { Directive, ElementRef, OnInit } from '@angular/core';

@Directive({
  selector: '[appTabs]',
  standalone: true
})
export class TabsDirective implements OnInit {
  constructor(private readonly elRef: ElementRef) {}

  ngOnInit(): void {
    this.initTabs();
  }

  private initTabs(): void {
    const tabLinks = this.elRef.nativeElement.querySelectorAll('.ps-tab-list li > a');

    tabLinks.forEach((link: HTMLElement) => {
      link.addEventListener('click', (e: Event) => {
        e.preventDefault();

        const targetSelector = link.getAttribute('href');
        if (!targetSelector) return;

        const li = link.closest('li');
        const tabContent = this.elRef.nativeElement.querySelector(targetSelector);

        li?.parentElement?.querySelectorAll('li').forEach((el: HTMLElement) => {
          el.classList.remove('active');
        });

        li?.classList.add('active');

        tabContent?.parentElement?.querySelectorAll('.ps-tab').forEach((el: HTMLElement) => {
          el.classList.remove('active');
        });

        tabContent?.classList.add('active');
      });
    });
  }
}
