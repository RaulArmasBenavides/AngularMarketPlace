import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { ProductsService } from '../../services/products.service';
import { Product } from '../../models/product.model';

export interface TopBanner {
	title: string;
	description: string;
	image: string;
	link?: string;
}

@Component({
	selector: 'app-header-promotion',
	templateUrl: './header-promotion.component.html',
	styleUrls: ['./header-promotion.component.css'],
	standalone: false,
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderPromotionComponent implements OnInit, OnDestroy {
	path: string = environment.assets;
	topBanner: TopBanner | null = null;
	isLoading: boolean = true;
	private destroy$ = new Subject<void>();

	constructor(private readonly productsService: ProductsService) {}

	ngOnInit(): void {
		this.loadRandomBanner();
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

	private loadRandomBanner(): void {
		this.productsService
			.getData()
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (products: Product[]) => {
					const randomProduct = this.getRandomProduct(products);
					if (randomProduct && randomProduct.title) {
						try {
							const bannerData = JSON.parse(randomProduct.title);
							this.topBanner = bannerData;
						} catch (error) {
							console.error('Error parsing banner data:', error);
							this.topBanner = this.getDefaultBanner(randomProduct);
						}
					}
					this.isLoading = false;
				},
				error: (err) => {
					console.error('Error loading products:', err);
					this.isLoading = false;
				}
			});
	}

	private getRandomProduct(products: Product[]): Product | undefined {
		const randomIndex = Math.floor(Math.random() * products.length);
		return products[randomIndex];
	}

	private getDefaultBanner(product: Product): TopBanner {
		return {
			title: product.title || 'Promotion',
			description: product.category || 'Check out our latest products',
			image: product.image || ''
		};
	}
}
