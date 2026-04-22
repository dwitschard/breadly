import { RecipeFormComponent } from './recipe-form.component';
import { renderWithProviders, screen, userEvent } from '../../../../testing/render-with-providers';

describe('RecipeFormComponent', () => {
  const user = userEvent.setup();

  it('submit button is disabled when the input is empty', async () => {
    await setup();

    expect(screen.getByRole('button', { name: 'COMMON.ADD' })).toBeDisabled();
  });

  it('enables submit button once user types a name', async () => {
    await setup();

    await user.type(screen.getByRole('textbox', { name: 'RECIPES.NAME_LABEL' }), 'Bread');

    expect(screen.getByRole('button', { name: 'COMMON.ADD' })).toBeEnabled();
  });

  it('emits submitRecipe with trimmed name and resets the input', async () => {
    const submitRecipe = vi.fn();
    await setup({ submitRecipe });

    await user.type(screen.getByRole('textbox', { name: 'RECIPES.NAME_LABEL' }), '  Bread  ');
    await user.click(screen.getByRole('button', { name: 'COMMON.ADD' }));

    expect(submitRecipe).toHaveBeenCalledWith({ name: 'Bread' });
    expect(screen.getByRole('textbox', { name: 'RECIPES.NAME_LABEL' })).toHaveValue('');
  });

  it('does not emit when the input contains only whitespace', async () => {
    const submitRecipe = vi.fn();
    await setup({ submitRecipe });

    await user.type(screen.getByRole('textbox', { name: 'RECIPES.NAME_LABEL' }), '   ');
    await user.click(screen.getByRole('button', { name: 'COMMON.ADD' }));

    expect(submitRecipe).not.toHaveBeenCalled();
  });

  async function setup(on: { submitRecipe?: (dto: { name: string }) => void } = {}) {
    return renderWithProviders(RecipeFormComponent, { on });
  }
});
