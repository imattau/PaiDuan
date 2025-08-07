export async function promptPassphrase(message: string): Promise<string | null> {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/50';
    overlay.innerHTML = `
      <div class="rounded bg-background p-4 text-foreground">
        <div class="mb-2">${message}</div>
        <input type="password" class="mb-3 w-full rounded border p-2" />
        <div class="flex justify-end space-x-2">
          <button class="cancel px-3 py-1">Cancel</button>
          <button class="ok rounded bg-accent px-3 py-1 text-white">OK</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const input = overlay.querySelector('input') as HTMLInputElement;
    const cleanup = () => document.body.removeChild(overlay);

    overlay.querySelector('.ok')?.addEventListener('click', () => {
      const val = input.value;
      cleanup();
      resolve(val);
    });

    overlay.querySelector('.cancel')?.addEventListener('click', () => {
      cleanup();
      resolve(null);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        overlay.querySelector('.ok')?.dispatchEvent(new Event('click'));
      }
    });

    input.focus();
  });
}
