import { Directive, ElementRef, OnInit } from '@angular/core';

@Directive({
  selector: '[appMobileMenu]',
  standalone: true
})
export class MobileMenuDirective implements OnInit {
  constructor(private readonly elRef: ElementRef) {}

  ngOnInit(): void {
    this.initMenuToggle();
    this.initFilterToggle();
    this.initSubMenu();
  }

  private initMenuToggle(): void {
    const navSidebar = this.elRef.nativeElement.querySelector('.navigation--sidebar');
    const overlay = this.elRef.nativeElement.querySelector('.ps-site-overlay');

    this.elRef.nativeElement.querySelectorAll('.menu-toggle-open').forEach((btn: HTMLElement) => {
      btn.addEventListener('click', (e: Event) => {
        e.preventDefault();
        btn.classList.toggle('active');
        navSidebar?.classList.toggle('active');
        overlay?.classList.toggle('active');
      });
    });
  }

  private initFilterToggle(): void {
    const filterSidebar = this.elRef.nativeElement.querySelector('.ps-filter--sidebar');
    const overlay = this.elRef.nativeElement.querySelector('.ps-site-overlay');

    this.elRef.nativeElement.querySelectorAll('.ps-toggle--sidebar').forEach((btn: HTMLElement) => {
      btn.addEventListener('click', (e: Event) => {
        e.preventDefault();
        const targetSelector = btn.getAttribute('href');
        if (!targetSelector) return;

        const target = this.elRef.nativeElement.querySelector(targetSelector);
        btn.classList.toggle('active');
        target?.classList.toggle('active');
        overlay?.classList.toggle('active');
      });
    });

    this.elRef.nativeElement.querySelectorAll('.ps-filter__header .ps-btn--close').forEach((btn: HTMLElement) => {
      btn.addEventListener('click', () => {
        filterSidebar?.classList.remove('active');
        overlay?.classList.remove('active');
      });
    });
  }

  private initSubMenu(): void {
    const toggles = this.elRef.nativeElement.querySelectorAll('.menu--mobile .menu-item-has-children > .sub-toggle');

    toggles.forEach((toggle: HTMLElement) => {
      toggle.addEventListener('click', (e: Event) => {
        e.preventDefault();

        const parent = toggle.parentElement as HTMLElement;
        const submenu = parent.querySelector('.sub-menu') as HTMLElement;

        toggle.classList.toggle('active');
        submenu?.classList.toggle('open');

        parent.querySelectorAll('.sub-menu').forEach((el: Element) => {
          if (el !== submenu) (el as HTMLElement).classList.remove('open');
        });
      });
    });
  }
}
