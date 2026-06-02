import { Component, OnInit } from '@angular/core';
import { MasonryItem } from './modals/MasonryItem.model';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.css'],
	standalone: false
})
export class AppComponent implements OnInit {
	items: MasonryItem[] = [];
	activeFilter: string = '*';

	constructor() {}

	ngOnInit(): void {
		// Initialize component state
	}
}
