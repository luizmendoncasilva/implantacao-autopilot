/* Placeholder de trilha ainda não desenhada — portado de ComingSoonFeature.jsx. */
(function (global) {
  function render(title, description, status) {
    status = status || "Próxima etapa";
    return (
      '<div class="flex items-center justify-center p-6" style="min-height:60vh;">' +
      '<div class="card max-w-md w-full">' +
      '<div class="card-content flex flex-col items-center gap-4" style="text-align:center;">' +
      '<div class="flex items-center justify-center size-12 rounded-full" style="background:var(--muted); color:var(--muted-foreground);">' +
      Icon("clock", "size-6") +
      "</div>" +
      '<div class="flex flex-col items-center gap-2">' +
      '<div class="flex items-center justify-center gap-2 flex-wrap">' +
      '<h2 class="text-lg font-semibold">' + title + "</h2>" +
      '<span class="badge badge-warning">' + status + "</span>" +
      "</div>" +
      '<p class="text-sm text-muted">' + description + "</p>" +
      "</div></div></div></div>"
    );
  }
  global.ComingSoon = { render };
})(window);
