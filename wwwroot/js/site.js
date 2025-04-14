// Search
document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    searchInput.addEventListener('input', function () {
        const searchText = this.value.toLowerCase();
        document.querySelectorAll('.accordion-item').forEach(item => {
            const headerText = item.querySelector('.accordion-button')?.innerText.toLowerCase() || '';
            const listItems = item.querySelectorAll('.accordion-body ul li');

            let itemMatches = false;
            listItems.forEach(li => {
                const match = li.innerText.toLowerCase().includes(searchText);
                li.style.display = match ? '' : 'none';
                if (match) itemMatches = true;
            });

            item.style.display = headerText.includes(searchText) || itemMatches ? '' : 'none';
        });
    });
});

$(document).ready(function () {
    $('.chart-link').on('click', function () {
        const chartId = $(this).data('chart');

        // 🔥 Highlight active item
        $('.chart-link').removeClass('active');
        $(this).addClass('active');

        // Optional: show loading spinner
        $('#chartContainer').html('<div class="text-center mt-5">Loading chart...</div>');

        $.ajax({
            url: '/Charts/LoadChart',
            type: 'GET',
            data: { id: chartId },
            success: function (result) {
                $('#chartContainer').html(result);
            },
            error: function () {
                $('#chartContainer').html('<div class="alert alert-danger">Error loading chart.</div>');
            }
        });
    });
});

$(document).ready(function () {
    $('.chart-link').on('click', function () {
        const chartId = $(this).data('chart');

        $('.chart-link').removeClass('active');
        $(this).addClass('active');

        $('#chartContainer').html('<div class="text-center mt-5">Loading chart...</div>');

        // Load partial view
        $.ajax({
            url: '/Charts/LoadChart',
            type: 'GET',
            data: { id: chartId },
            success: function (html) {
                $('#chartContainer').html(html);

                // Force-load the JS file every time (no cache)
                const script = document.createElement('script');
                script.src = `/js/charts/${chartId}.js?v=${Date.now()}`;
                script.async = true;

                // Remove old chart script (if any)
                const existingScript = document.querySelector(`script[src^="/js/charts/${chartId}.js"]`);
                if (existingScript) {
                    existingScript.remove();
                }

                document.body.appendChild(script);
            },
            error: function () {
                $('#chartContainer').html('<div class="alert alert-danger">Error loading chart.</div>');
            }
        });
    });
});
