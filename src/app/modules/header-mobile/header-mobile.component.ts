import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { CategoryHierarchyService } from '../../services/category-hierarchy.service';
import { Category } from '../../models/category.model';

export interface MobileCategory extends Category {
	subcategories: Array<{ name: string; url: string }>;
}

@Component({
	selector: 'app-header-mobile',
	templateUrl: './header-mobile.component.html',
	styleUrls: ['./header-mobile.component.css'],
	standalone: false,
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderMobileComponent implements OnInit, OnDestroy {
	path: string = environment.assets;
	categories: MobileCategory[] = [];
	private destroy$ = new Subject<void>();

	constructor(
		private readonly categoryHierarchyService: CategoryHierarchyService
	) {}

	ngOnInit(): void {
		this.loadMobileCategories();
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

	private loadMobileCategories(): void {
		this.categoryHierarchyService
			.getFooterCategories()
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (data) => {
					this.categories = data.map((item) => ({
						id: 0,
						name: item.category,
						slug: item.category.toLowerCase().replace(/\s+/g, '-'),
						url: item.category.toLowerCase(),
						subcategories: item.subcategories.map((sub) => ({
							name: sub.subcategory,
							url: sub.url
						}))
					})) as MobileCategory[];
				},
				error: (err) => {
					console.error('Error loading mobile categories:', err);
				}
			});
	}
}
