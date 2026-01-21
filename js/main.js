$(document).ready(function() {

    // Contact form validation
    if ($('#contact-form').length) {
        const $form = $('#contact-form');
        const fields = {
            firstname: { 
                pattern: /^[A-Za-z\u0600-\u06FF]+([\s'-][A-Za-z\u0600-\u06FF]+)*$/, 
                msg: 'First name must contain only letters, spaces, hyphens, or apostrophes',
                min: 2,
                minMsg: 'First name must be at least 2 characters'
            },
            lastname: { 
                pattern: /^[A-Za-z\u0600-\u06FF]+([\s'-][A-Za-z\u0600-\u06FF]+)*$/, 
                msg: 'Last name must contain only letters, spaces, hyphens, or apostrophes',
                min: 2,
                minMsg: 'Last name must be at least 2 characters'
            },
            email: { 
                pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, 
                msg: 'Invalid email format (e.g., name@example.com)' 
            },
            phone: { 
                pattern: /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/, 
                msg: 'Invalid phone format (e.g., +963 930 221 387 or 0930221387)',
                min: 8,
                minMsg: 'Phone number must be at least 8 digits'
            },
            address: { 
                min: 10, 
                msg: 'Address must be at least 10 characters',
                pattern: /^[A-Za-z0-9\u0600-\u06FF\s,\.\-]+$/,
                patternMsg: 'Address contains invalid characters'
            },
            subject: { 
                min: 5, 
                msg: 'Subject must be at least 5 characters',
                max: 100,
                maxMsg: 'Subject must not exceed 100 characters'
            },
            message: { 
                min: 10, 
                msg: 'Message must be at least 10 characters',
                max: 1000,
                maxMsg: 'Message must not exceed 1000 characters'
            }
        };

        function sanitize(str) {
            if (!str) return '';
            return $('<div>').text(str).html().trim();
        }

        function validateField($field, rules) {
            const val = sanitize($field.val());
            let isValid = true;
            let errorMsg = '';
            const fieldId = $field.attr('id') || $field.attr('name');
            const errorId = fieldId + '-error';

            if (!val) {
                isValid = false;
                errorMsg = 'This field is required';
            } else {
                // Check minimum length
                if (rules.min && val.length < rules.min) {
                    isValid = false;
                    errorMsg = rules.minMsg || rules.msg;
                }
                // Check maximum length
                else if (rules.max && val.length > rules.max) {
                    isValid = false;
                    errorMsg = rules.maxMsg || rules.msg;
                }
                // Check pattern
                else if (rules.pattern && !rules.pattern.test(val)) {
                    isValid = false;
                    errorMsg = rules.patternMsg || rules.msg;
                }
            }

            // Remove existing error
            const $existingError = $field.siblings(`#${errorId}, .field-error`);
            $existingError.remove();

            // Update field state
            if (isValid) {
                $field.removeClass('error').addClass('valid');
                $field.attr('aria-invalid', 'false');
                $field.removeAttr('aria-describedby');
            } else {
                $field.removeClass('valid').addClass('error');
                $field.attr('aria-invalid', 'true');
                $field.attr('aria-describedby', errorId);
                
                // Add error message
                const $error = $(`<span id="${errorId}" class="field-error" role="alert" aria-live="polite">${errorMsg}</span>`);
                $field.after($error);
            }
            
            return isValid;
        }

        // Initialize validation for all fields
        Object.keys(fields).forEach(name => {
            const $field = $form.find(`[name="${name}"]`);
            if ($field.length) {
                // Real-time validation on input and blur
                $field.on('blur input', function() {
                    validateField($(this), fields[name]);
                    checkFormValidity();
                });
                
                // Clear validation state on focus
                $field.on('focus', function() {
                    $(this).removeClass('error valid');
                });
            }
        });

        function checkFormValidity() {
            let isValid = true;
            Object.keys(fields).forEach(name => {
                const $field = $form.find(`[name="${name}"]`);
                if ($field.length && !validateField($field, fields[name])) {
                    isValid = false;
                }
            });
            
            const $submitBtn = $form.find('input[type="submit"]');
            $submitBtn.prop('disabled', !isValid);
            
            // Update submit button
            if (isValid) {
                $submitBtn.attr('aria-label', 'Submit form');
            } else {
                $submitBtn.attr('aria-label', 'Form has errors. Please fix them before submitting.');
            }
        }

        $form.on('submit', function(e) {
            e.preventDefault();
            checkFormValidity();
            
            const $submitBtn = $form.find('input[type="submit"]');
            if (!$submitBtn.prop('disabled')) {
                const data = {};
                Object.keys(fields).forEach(name => {
                    const $field = $form.find(`[name="${name}"]`);
                    if ($field.length) {
                        data[name] = sanitize($field.val());
                    }
                });
                console.log('Form data:', data);
                
                // For submit, we'll just log it
                alert('Form submitted successfully! (Check console for data)');
            } else {
                const $firstError = $form.find('.error').first();
                if ($firstError.length) {
                    $firstError.focus();
                }
            }
        });

        // Handle reset button
        $form.find('input[type="reset"]').on('click', function() {
            setTimeout(function() {
                $form.find('.field-error').remove();
                $form.find('.error, .valid').removeClass('error valid');
                $form.find('input, textarea').removeAttr('aria-invalid aria-describedby');
                checkFormValidity();
            }, 0);
        });
    }

    // Events page AJAX filtering
    if ($('#form_search').length) {
        const $form = $('#form_search');
        const $container = $('#events_container');
        const $events = $container.find('.event').clone();

        function filterEvents() {
            const search = $('#search_input').val().toLowerCase().trim();
            const dateInput = $form.find('input[type="date"]').val();
            const category = $form.find('select').eq(0).val();
            const location = $form.find('select').eq(1).val();

            $container.html('<div class="loading">Loading...</div>');

            setTimeout(() => {
                let filtered = $events.filter(function() {
                    const $el = $(this);
                    const text = $el.text().toLowerCase();
                    const evtCat = $el.find('.event_category').text().toLowerCase().trim();
                    const $locEl = $el.find('.event_location');
                    const evtLoc = $locEl.attr('class') || '';
                    const evtDateText = $el.find('.event_time').text();

                    // Search filter
                    const matchSearch = !search || text.includes(search);
                    
                    // Category filter
                    let matchCat = true;
                    if (category && category !== 'Event Category') {
                        // Map select values to event category text format
                        const categoryMap = {
                            'Cultural Events': 'cultural',
                            'Sports Events': 'sports',
                            'Musical Events': 'musical',
                            'Familial Events': 'familial'
                        };
                        const searchCategory = categoryMap[category] || category.toLowerCase();
                        matchCat = evtCat.includes(searchCategory);
                    }
                    
                    // Location filter
                    const matchLoc = !location || location === 'Event Location' || evtLoc.includes(location);
                    
                    // Date filter - convert date input format (YYYY-MM-DD) to match event format (DD/MM/YYYY)
                    let matchDate = true;
                    if (dateInput) {
                        // Convert YYYY-MM-DD to DD/MM/YYYY
                        const dateParts = dateInput.split('-');
                        const formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
                        // Check if event date text contains the formatted date
                        matchDate = evtDateText.includes(formattedDate);
                    }

                    return matchSearch && matchCat && matchLoc && matchDate;
                });

                if (filtered.length) {
                    $container.html(filtered);
                } else {
                    $container.html('<div class="error-state">No events found matching your criteria.</div>');
                }
            }, 300);
        }

        $form.find('input, select').on('change input', filterEvents);
        $form.on('submit', function(e) {
            e.preventDefault();
            filterEvents();
        });
        
        // Clear Filters button functionality
        $form.on('click', '.clear-filters', function(e) {
            e.preventDefault();
            $form.find('#search_input').val('');
            $form.find('input[type="date"]').val('');
            $form.find('select').eq(0).val('Event Category').prop('selectedIndex', 0);
            $form.find('select').eq(1).val('Event Location').prop('selectedIndex', 0);
            filterEvents();
        });
    }

    // Back to Top Button
    const $backToTopBtn = $('#backToTop');
    
    // Show/hide back to top button based on scroll
    $(window).on('scroll', function() {
        if ($(window).scrollTop() > 300) {
            $backToTopBtn.addClass('show');
        } else {
            $backToTopBtn.removeClass('show');
        }
    });
    
    // Smooth scroll to top when button is clicked
    $backToTopBtn.on('click', function(e) {
        e.preventDefault();
        $('html, body').animate({ scrollTop: 0 }, 800);
    });
});
