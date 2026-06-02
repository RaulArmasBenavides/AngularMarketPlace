import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { CategoryHierarchyService, CategoryWithSubcategories, SubCategoryItem } from '../../services/category-hierarchy.service';

@Component({
	selector: 'app-header',
	templateUrl: './header.component.html',
	styleUrls: ['./header.component.css'],
	standalone: false,
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent implements OnInit, OnDestroy {
	path: string = environment.assets;
	categoriesWithSubcategories: CategoryWithSubcategories[] = [];
	private destroy$ = new Subject<void>();

	constructor(
		private readonly categoryHierarchyService: CategoryHierarchyService
	) {}

	ngOnInit(): void {
		this.loadCategoriesWithSubcategories();
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

	private loadCategoriesWithSubcategories(): void {
		this.categoryHierarchyService
			.getCategoriesWithSubcategories()
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (data) => {
					this.categoriesWithSubcategories = data;
				},
				error: (err) => {
					console.error('Error loading categories:', err);
				}
			});
	}

	getSubcategoriesByTitle(titleList: string): SubCategoryItem[] {
		return this.categoriesWithSubcategories
			.reduce((acc: SubCategoryItem[], cat: CategoryWithSubcategories) => [
				...acc,
				...cat.subcategories
			], [])
			.filter((sub: SubCategoryItem) => sub.titleList === titleList);
	}
}
