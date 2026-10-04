/**
 * Button: one primary action per view; everything else `secondary`.
 */
import { Button } from './Button.js';

export default function ButtonRecipe() {
  return (
    <div>
      <Button variant="secondary">Cancel</Button>
      <Button>Save</Button>
    </div>
  );
}
