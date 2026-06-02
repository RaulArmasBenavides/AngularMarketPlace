import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { CategoryHierarchyService } from '../../services/category-hierarchy.service';

export interface CategoryWithSubcategories {
	category: string;
	subcategories: Array<{
		titleList: string;
		subcategory: string;
		url: string;
		category?: string;
	}>;
}

@Component({
	selector: 'app-footer',
	templateUrl: './footer.component.html',
	styleUrls: ['./footer.component.css'],
	standalone: false,
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class FooterComponent implements OnInit, OnDestroy {
	path: string = environment.assets;
	footerCategories: CategoryWithSubcategories[] = [];
	private destroy$ = new Subject<void>();

	constructor(
		private readonly categoryHierarchyService: CategoryHierarchyService
	) {}

	ngOnInit(): void {
		this.loadFooterCategories();
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

	private loadFooterCategories(): void {
		this.categoryHierarchyService
			.getFooterCategories()
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (data) => {
					this.footerCategories = data;
				},
				error: (err) => {
					console.error('Error loading footer categories:', err);
				}
			});
	}
}
