import { TestBed, ComponentFixture } from '@angular/core/testing';
import { RecipeListComponent } from './recipe-list.component';
import { Recipe } from '../../../generated/api';

const mockRecipes: Recipe[] = [
  { _id: '1', name: 'Pasta' },
  { _id: '2', name: 'Pizza' },
];

describe('RecipeListComponent', () => {
  let fixture: ComponentFixture<RecipeListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecipeListComponent],
    }).compileComponents();
  });

  it('should create', () => {
    fixture = TestBed.createComponent(RecipeListComponent);
    fixture.componentRef.setInput('recipes', []);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('shows empty message when no recipes', () => {
    fixture = TestBed.createComponent(RecipeListComponent);
    fixture.componentRef.setInput('recipes', []);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Noch keine Rezepte');
  });

  it('renders recipe items', () => {
    fixture = TestBed.createComponent(RecipeListComponent);
    fixture.componentRef.setInput('recipes', mockRecipes);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const items = el.querySelectorAll('li');
    expect(items.length).toBe(2);
    expect(items[0].textContent).toContain('Pasta');
    expect(items[1].textContent).toContain('Pizza');
  });

  it('emits deleteRecipe when delete button is clicked', () => {
    fixture = TestBed.createComponent(RecipeListComponent);
    fixture.componentRef.setInput('recipes', mockRecipes);
    fixture.detectChanges();

    const emitSpy = vi.spyOn(fixture.componentInstance.deleteRecipe, 'emit');
    const deleteButton = fixture.nativeElement.querySelector('button');
    deleteButton.click();

    expect(emitSpy).toHaveBeenCalledWith(mockRecipes[0]);
  });
});
