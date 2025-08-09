export async function promptPassphrase(message: string): Promise<string | null> {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/50';
    overlay.innerHTML = `
      <div class="rounded bg-background-primary p-4 text-primary">
        <div class="mb-2">${message}</div>
        <form>
          <input type="password" class="mb-3 w-full rounded border p-2" />
          <div class="flex justify-end space-x-2">
            <button type="button" class="cancel px-3 py-1">Cancel</button>
            <button type="submit" class="ok rounded bg-accent-primary px-3 py-1 text-white">OK</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(overlay);

    const input = overlay.querySelector('input') as HTMLInputElement;
    const form = overlay.querySelector('form') as HTMLFormElement;
    const cleanup = () => document.body.removeChild(overlay);

    const okHandler = () => {
      const val = input.value;
      cleanup();
      resolve(val);
    };
    overlay.querySelector('.ok')?.addEventListener('click', okHandler);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      okHandler();
    });

    overlay.querySelector('.cancel')?.addEventListener('click', () => {
      cleanup();
      resolve(null);
    });

    input.focus();
  });
}
