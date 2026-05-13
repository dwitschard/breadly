import { RecipeListComponent } from './recipe-list.component';
import { Recipe } from '../../../generated/api';
import {
  renderWithProviders,
  screen,
  userEvent,
  within,
} from '../../../../testing/render-with-providers';

describe('RecipeListComponent', () => {
  const user = userEvent.setup();

  it('shows empty-state message when recipes list is empty', async () => {
    await setup([]);

    expect(screen.getByText('RECIPES.EMPTY')).toBeInTheDocument();
  });

  it('renders a list item for each recipe', async () => {
    await setup(mockRecipes);

    expect(screen.getByText('Pasta')).toBeInTheDocument();
    expect(screen.getByText('Pizza')).toBeInTheDocument();
  });

  it('emits deleteRecipe with the correct recipe when delete button is clicked', async () => {
    const deleteRecipe = vi.fn();
    await setup(mockRecipes, { deleteRecipe });

    await user.click(screen.getByTestId('recipe-delete-btn-1'));

    expect(deleteRecipe).toHaveBeenCalledTimes(1);
    expect(deleteRecipe).toHaveBeenCalledWith(mockRecipes[0]);
  });

  it('each recipe has its own delete button scoped to the list item', async () => {
    await setup(mockRecipes);

    const pastaItem = screen.getByText('Pasta').closest('li')!;
    expect(within(pastaItem).getByTestId('recipe-delete-btn-1')).toBeInTheDocument();
  });

  const mockRecipes: Recipe[] = [
    { _id: '1', name: 'Pasta' },
    { _id: '2', name: 'Pizza' },
  ];

  async function setup(recipes: Recipe[], on: { deleteRecipe?: (r: Recipe) => void } = {}) {
    return renderWithProviders(RecipeListComponent, {
      componentInputs: { recipes },
      on,
    });
  }
});
