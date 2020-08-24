$(document).ready(function(){
    $('#shipping-fee-btn').click(function(e){
        e.preventDefault();
        e.stopImmediatePropagation();
        $('#shipping-fee-btn').prop('disabled', true);
        $('#shippingFeeError').text('');  

        let shippingFeeInput = $('#shippingFeeInput').val();
        if (shippingFeeInput == "") {
            $('#shipping-fee-btn').prop('disabled', false);
            return;
        }

        if (shippingFeeInput >= (Number.MAX_SAFE_INTEGER - 10) || shippingFeeInput < 0) {
            $('#shippingFeeError').text('Invalid shipping fee amount');   
            $('#shipping-fee-btn').prop('disabled', false);
            return;
        }
        let shippingFeeCartId = $('#shippingFeeCartId').val();
        let url = '/admin/orders/updateShippingFee';

        $.post(url, {shippingFeeCartId: shippingFeeCartId, shippingFeeInput: shippingFeeInput, js: true}, (data) => {
            $('#shippingFee').html('<b>Shipping Fee: </b> ' + data.shippingFee);
            $('#totalPrice').html('<b>Total price: </b>' + data.totalPrice);

            $('#shipping-fee-btn').prop('disabled', false);
        });
    });

    $('#paginator').on('change', function (param) {
        let url = $(this).val(); // get selected value
        if (url) { // require a URL
            window.location = url; // redirect
        }
        return false;
      });

    $('#newProductBtn').click(function(e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        $('#newProductError').text("");

        let style = $('#newProductStyle').val();
        let color = $('#newProductColor').val();
        let price = $('#newProductPrice').val();
        let s = $('#newProductS').val();
        let m = $('#newProductM').val();
        let l = $('#newProductL').val();
        let xl = $('#newProductXl').val();

        if (price > (Number.MAX_SAFE_INTEGER - 10)) {
            $('#newProductError').text("Price input too large!");
            return;
        }

        if (s > (Number.MAX_SAFE_INTEGER - 10)) {
            $('#newProductError').text("S input too large!");
            return;
        }

        if (m > (Number.MAX_SAFE_INTEGER - 10)) {
            $('#newProductError').text("M input too large!");
            return;
        }

        if (l > (Number.MAX_SAFE_INTEGER - 10)) {
            $('#newProductError').text("L input too large!");
            return;
        }

        if (xl > (Number.MAX_SAFE_INTEGER - 10)) {
            $('#newProductError').text("XL input too large!");
            return;
        }


        if ($.trim(style).length < 1 || $.trim(color).length < 1 || s == "" || m == "" || l == "" || xl == "") {
            $('#newProductError').text("All fields required!");
            return;
        }

        if ($.trim(style).length > 16) {
            $('#newProductError').text("Style should only be a maximum of 16 characters!");
            return;
        }

        if ($.trim(color).length > 16) {
            $('#newProductError').text("Color should only be a maximum of 16 characters!");
            return;
        }

        $.post("/admin/inventory/validateNewProduct", {style: style, color: color}, (data) => {
            if (data) {
                $('#newProductError').text("Product already exists in the inventory!")
                return;
            }

            $('#newProductForm').submit();
        })
    }) 

})