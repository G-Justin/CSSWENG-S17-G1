$(document).ready(function(){
    $('#shipping-fee-btn').click(function(e){
        e.preventDefault();
        e.stopImmediatePropagation();
        $('#shipping-fee-btn').prop('disabled', true);

        let shippingFeeInput = $('#shippingFeeInput').val();
        if (shippingFeeInput == "") {
            return;
        }
        let shippingFeeCartId = $('#shippingFeeCartId').val();
        let url = '/admin/orders/updateShippingFee';

        $.post(url, {shippingFeeCartId: shippingFeeCartId, shippingFeeInput: shippingFeeInput, js: true}, (data) => {
            $('#shippingFee').html('<b>Shipping Fee: </b> ' + data.shippingFee);
            $('#totalPrice').html('<b>Total price:</b>' + data.totalPrice);

            $('#shipping-fee-btn').prop('disabled', false);
        });
    }) 





})