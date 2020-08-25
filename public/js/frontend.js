
$(document).ready(function(){

    const MAX_INT = (Number.MAX_SAFE_INTEGER - 10);
    const MIN_INT = (Number.MIN_SAFE_INTEGER + 10);

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

        if (shippingFeeInput >= MAX_INT || shippingFeeInput < 0) {
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


        if (price > MAX_INT) {
            $('#newProductError').text("Price input too large!");
            return;
        }

        if (s > MAX_INT) {
            $('#newProductError').text("S input too large!");
            return;
        }

        if (m > MAX_INT) {
            $('#newProductError').text("M input too large!");
            return;
        }

        if (l > MAX_INT) {
            $('#newProductError').text("L input too large!");
            return;
        }

        if (xl > MAX_INT) {
            $('#newProductError').text("XL input too large!");
            return;
        }

        if (s % 1 != 0 || m % 1 != 0 || l % 1 != 0 || xl % 1 != 0) {
            $('#newProductError').text("Stocks must be in whole numbers!");
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

    
    $('.col-sm-12').on('click', '#updateStockBtn',  function(e) {
        e.preventDefault();
        e.stopImmediatePropagation();

        let errorMsg = $(this).parent().parent().find('div:nth-child(1)').find('div:nth-child(13)');
        errorMsg.text('');

        let productId = $(this).parent().find('textarea:nth-child(1)').val();
        let s = $(this).parent().parent().find('div:nth-child(1)').find('input:nth-child(2)').val();
        let m = $(this).parent().parent().find('div:nth-child(1)').find('input:nth-child(5)').val();
        let l = $(this).parent().parent().find('div:nth-child(1)').find('input:nth-child(8)').val();
        let xl = $(this).parent().parent().find('div:nth-child(1)').find('input:nth-child(11)').val();
        
        if (s < MIN_INT || s > MAX_INT) {
            errorMsg.text("Invalid small stock input!");;
            return;
        }

        if (m < MIN_INT || m > MAX_INT) {
            errorMsg.text("Invalid medium stock input!");;
            return;
        }

        if (l < MIN_INT || l > MAX_INT) {
            errorMsg.text("Invalid large stock input!");;
            return;
        }

        if (xl < MIN_INT || xl > MAX_INT) {
            errorMsg.text("Invalid extra-large stock input!");;
            return;
        }

        if (s % 1 != 0 || m % 1 != 0 || l % 1 != 0 || xl % 1 != 0) {
            errorMsg.text("Inputs must be whole numbers!");
            return;
        }

        let button = $(this);
        button.prop('disabled', true);
        $.post('/admin/inventory/validateStockUpdate', {_id: productId, s: s, m: m, l: l, xl: xl}, (data) => {
            if (!data.isValid) {
                button.prop('disabled', false);
                errorMsg.text(data.msg);
                return;
            }

            button.parent().parent().submit();
        })
    }) 

})