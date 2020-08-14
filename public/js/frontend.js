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
            $('#totalPrice').html('<b>Total price:</b>' + data.totalPrice);

            $('#shipping-fee-btn').prop('disabled', false);
        });
    });





})