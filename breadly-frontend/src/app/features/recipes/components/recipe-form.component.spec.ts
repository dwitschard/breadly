import { TestBed, ComponentFixture } from '@angular/core/testing';
import { RecipeFormComponent } from './recipe-form.component';

describe('RecipeFormComponent', () => {
  let fixture: ComponentFixture<RecipeFormComponent>;
  let component: RecipeFormComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecipeFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RecipeFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders an input and submit button', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('input')).toBeTruthy();
    expect(el.querySelector('button[type="submit"]')).toBeTruthy();
  });

  it('submit button is disabled when name is empty', () => {
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(button.disabled).toBe(true);
  });

  it('emits submitRecipe with trimmed name on submit', () => {
    const emitSpy = vi.spyOn(component.submitRecipe, 'emit');
    component.name.set('  Bread  ');
    fixture.detectChanges();

    component.onSubmit();

    expect(emitSpy).toHaveBeenCalledWith({ name: 'Bread' });
  });

  it('resets name after successful submit', () => {
    component.name.set('Bread');
    component.onSubmit();
    expect(component.name()).toBe('');
  });

  it('does not emit when name is whitespace only', () => {
    const emitSpy = vi.spyOn(component.submitRecipe, 'emit');
    component.name.set('   ');
    component.onSubmit();
    expect(emitSpy).not.toHaveBeenCalled();
  });
});
