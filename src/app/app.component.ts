import { Component, ElementRef, HostListener, OnInit, Renderer2 } from '@angular/core';
import { MasonryItem } from './modals/MasonryItem.model';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.css'],
	standalone: false
})
export class AppComponent implements OnInit {
	private parallaxElements: HTMLElement[] = [];
	private readonly windowHeight = window.innerHeight;
	items: MasonryItem[] = [];
	activeFilter: string = '*';
	constructor(
		private readonly elRef: ElementRef,
		private readonly renderer: Renderer2
	) {}
	ngOnInit() {}

	private isMobile(): boolean {
		return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(navigator.userAgent);
	}

	ngAfterViewInit(): void {
		this.parallaxElements = Array.from(this.elRef.nativeElement.querySelectorAll('.bg--parallax'));

		if (this.isMobile()) {
			this.disableParallaxOnMobile();
		}

		this.backgroundImage();
		this.siteToggleAction();
		this.subMenuToggle();
		this.tabsInit();
		this.initCustomScrollbar();

	}
	private disableParallaxOnMobile(): void {
		this.parallaxElements.forEach((el) => {
			el.style.backgroundAttachment = 'scroll';
		});
	}

	private backgroundImage(): void {
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

	private siteToggleAction(): void {
		const navSidebar = this.elRef.nativeElement.querySelector('.navigation--sidebar');
		const filterSidebar = this.elRef.nativeElement.querySelector('.ps-filter--sidebar');
		const overlay = this.elRef.nativeElement.querySelector('.ps-site-overlay');

		this.elRef.nativeElement.querySelectorAll('.menu-toggle-open').forEach((btn: HTMLElement) => {
			btn.addEventListener('click', (e) => {
				e.preventDefault();
				btn.classList.toggle('active');
				navSidebar?.classList.toggle('active');
				overlay?.classList.toggle('active');
			});
		});

		this.elRef.nativeElement.querySelectorAll('.ps-toggle--sidebar').forEach((btn: HTMLElement) => {
			btn.addEventListener('click', (e) => {
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

	private tabsInit(): void {
		const tabLinks = this.elRef.nativeElement.querySelectorAll('.ps-tab-list li > a');

		tabLinks.forEach((link: HTMLElement) => {
			link.addEventListener('click', (e) => {
				e.preventDefault();

				const targetSelector = link.getAttribute('href');
				if (!targetSelector) return;

				const li = link.closest('li');
				const tabContent = this.elRef.nativeElement.querySelector(targetSelector);

				li?.parentElement?.querySelectorAll('li').forEach((el) => el.classList.remove('active'));

				li?.classList.add('active');

				tabContent?.parentElement?.querySelectorAll('.ps-tab').forEach((el: any) => el.classList.remove('active'));

				tabContent?.classList.add('active');
			});
		});
	}

	private subMenuToggle(): void {
		const toggles = this.elRef.nativeElement.querySelectorAll('.menu--mobile .menu-item-has-children > .sub-toggle');

		toggles.forEach((toggle: HTMLElement) => {
			toggle.addEventListener('click', (e) => {
				e.preventDefault();

				const parent = toggle.parentElement as HTMLElement;
				const submenu = parent.querySelector('.sub-menu') as HTMLElement;

				toggle.classList.toggle('active');
				submenu?.classList.toggle('open');

				parent.querySelectorAll('.sub-menu').forEach((el) => {
					if (el !== submenu) el.classList.remove('open');
				});
			});
		});
	}

	private initCustomScrollbar(): void {
		const elements = this.elRef.nativeElement.querySelectorAll('.ps-custom-scrollbar');

		elements.forEach((el: HTMLElement) => {
			const height = el.getAttribute('data-height');
			if (height) {
				el.style.maxHeight = `${height}px`;
			}
		});
	}
	@HostListener('window:scroll')
	onWindowScroll(): void {
		const scrollTop = window.scrollY;

		if (!this.isMobile()) {
			this.handleParallax(scrollTop);
		}

		this.handleStickyHeader(scrollTop);
	}

	private handleParallax(scrollTop: number): void {
		this.parallaxElements.forEach((el) => {
			const rect = el.getBoundingClientRect();
			const elementTop = rect.top + scrollTop;
			const elementHeight = rect.height;

			if (elementTop + elementHeight < scrollTop || elementTop > scrollTop + this.windowHeight) {
				return;
			}

			const yPos = Math.round((elementTop - scrollTop) * 0.2);
			el.style.backgroundPosition = `50% ${yPos}px`;
		});
	}

	private handleStickyHeader(scrollTop: number): void {
		const checkpoint = 50;

		this.elRef.nativeElement.querySelectorAll('.header[data-sticky="true"]').forEach((header: HTMLElement) => {
			header.classList.toggle('header--sticky', scrollTop > checkpoint);
		});

		const stickyCart = this.elRef.nativeElement.querySelector('#cart-sticky');
		stickyCart?.classList.toggle('active', scrollTop > checkpoint);
	}
}
