$(document).ready(function () {
    $('.chart-link').on('click', function () {
        const chartId = $(this).data('chart');

        // Highlight active item
        $('.chart-link').removeClass('active');
        $(this).addClass('active');

        // Show loading placeholder
        $('#chartContainer').html('<div class="text-center mt-5">Loading chart...</div>');

        // Load the chart partial view (e.g., _ColumnBasic.cshtml)
        $.ajax({
            url: '/Charts/LoadChart',
            type: 'GET',
            data: { id: chartId },
            success: function (html) {
                $('#chartContainer').html(html);
            },
            error: function () {
                $('#chartContainer').html('<div class="alert alert-danger">Error loading chart.</div>');
            }
        });
    });
});
