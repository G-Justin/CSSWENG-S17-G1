

$(document).ready(function(){

    const MAX_INT = (Number.MAX_SAFE_INTEGER - 10);
    const MIN_INT = (Number.MIN_SAFE_INTEGER + 10);

    const CART = {
        KEY: "cart",
        contents: [],
        init() {
            let _contents = localStorage.getItem(CART.KEY)
            if (_contents) {
                CART.contents = JSON.parse(_contents)
            } else {

            }
            CART.sync()
        },
        async sync() {
            let _cart = JSON.stringify(CART.contents);
            await localStorage.setItem(CART.KEY, _cart);
        },
        add(order) {
            let found = false;
            let foundIndex;
            for (let i = 0; i < CART.contents.length; i++) {
                if (CART.contents[i].product == order.productId) {
                    foundIndex = i;
                    found = true;
                    break;
                }
            }

            if (found) {
                switch(order.size){
                    case "S":
                        CART.contents[foundIndex].smallAmount = CART.contents[foundIndex].smallAmount + Number(order.amount);
                        break;
                    case "M":
                        CART.contents[foundIndex].mediumAmount = CART.contents[foundIndex].mediumAmount + Number(order.amount);
                        break;
                    case "L":
                        CART.contents[foundIndex].largeAmount = CART.contents[foundIndex].largeAmount + Number(order.amount);
                        break;
                    case "XL":
                        CART.contents[foundIndex].extraLargeAmount = CART.contents[foundIndex].extraLargeAmount + Number(order.amount);
                        break;
                    default:
                        alert('error')
                        break;
                }
                CART.contents[foundIndex].price = CART.contents[foundIndex].price + Number(order.price);
                CART.sync();
                return;
            }

            let orderItem = {
                product: order.productId,
                price: order.price,
                image: order.image,
                style: order.style,
                color: order.color,
                description: order.description,
                smallAmount: 0,
                mediumAmount: 0,
                largeAmount: 0,
                extraLargeAmount: 0
            }

            switch(order.size){
                case "S":
                    orderItem.smallAmount = orderItem.smallAmount + Number(order.amount);
                    break;
                case "M":
                    orderItem.mediumAmount = orderItem.mediumAmount + Number(order.amount);
                    break;
                case "L":
                    orderItem.largeAmount = orderItem.largeAmount + Number(order.amount);
                    break;
                case "XL":
                    orderItem.extraLargeAmount = orderItem.extraLargeAmount + Number(order.amount);
                    break;
                default:
                    alert('error')
                    break;
            }
            
            
            CART.contents.push(orderItem);
            CART.sync();
        }

    }
    
    CART.init();
    $('#updateDeliveryDateBtn').click(function (e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        $(this).prop('disabled', true);
        $('#updateDeliveryDateError').text("");

        let _id = $('#updateStatusId').val();
        let deliveryDate = $('#deliveryDate').val();
        let deliveryStatus = $('#deliveryStatus').val();

        $.post('/admin/cart/checkDeliveryUpdate', {_id: _id, deliveryDate: deliveryDate}, (data) => {
            if (!data) {
                $(this).prop('disabled', false);
                $('#updateDeliveryDateError').text("Delivery date entered is earlier than the order date!");
                return;
            }

            $.post('/admin/cart/checkDeliveryStatusUpdate', {_id: _id, deliveryStatus: deliveryStatus}, (hasDeficit) => {
                if (hasDeficit) {
                    $(this).prop('disabled', false);
                    $('#updateDeliveryDateError').text("Order has deficit. Please resolve before setting to delivered.");
                    return;
                }

                $(this).prop('disabled', false);
                $('#updateDeliveryStatusForm').submit();
            })

            

            
        })
      }) 

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

        $('#shippingFeeForm').submit();
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
        let description = $('#newProductDescription').val();
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


        if ($.trim(style).length < 1 || $.trim(color).length < 1 || $.trim(description).length < 1 || s == "" || m == "" || l == "" || xl == "") {
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

        if ($.trim(description).length > 20) {
            $('#newProductError').text("Description should only be a maximum of 20 characters!");
            return;
        }

        $.post("/admin/inventory/validateNewProduct", {style: style, color: color, description: description}, (data) => {
           

            if (data.isPhasedOut == false) {
                $('#newProductError').text("Product already exists in the inventory!")
                return;
            }

            if (data.isPhasedOut == true) {
                $('#newProductError').text("Phased out product exists. Phase it back in instead.");
                return;
            }

            $('#newProductForm').submit();
            
        })
    }) 

    $('#newJobOrderBtn').click(function(e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        $('#newJobOrderError').text('');

        let batchNo = $('#newJobOrderBatchNo').val();
        let style  =  $('#newJobOrderStyle').val();
        let color =  $('#newJobOrderColor').val();
        let description =  $('#newJobOrderDescription').val();
        let smallOrder =  $('#newJobOrderSmall').val();
        let mediumOrder = $('#newJobOrderMedium').val();
        let largeOrder =  $('#newJobOrderLarge').val();
        let extraLargeOrder = $('#newJobOrderExtraLarge').val();
        let yardage =  $('#newJobOrderYardage').val();
        let remarks =  $('#newJobOrderRemarks').val();

        if (batchNo.trim() == "" || style.trim() == "" || color.trim() == "" || description.trim() == "" ||
        smallOrder == "" || mediumOrder == "" || largeOrder == "" || extraLargeOrder == "") {
            $('#newJobOrderError').text("All fields except optional ones required!");
            return;
        } 

        if (smallOrder > MAX_INT || smallOrder < MIN_INT) {
            $('#newJobOrderError').text("Invalid small amount!");
            return;
        }

        if (mediumOrder > MAX_INT || mediumOrder < MIN_INT) {
            $('#newJobOrderError').text("Invalid medium amount!");
            return;
        }

        if (largeOrder > MAX_INT || mediumOrder < MIN_INT) {
            $('#newJobOrderError').text("Invalid large amount!");
            return;
        }

        if (extraLargeOrder > MAX_INT || mediumOrder < MIN_INT) {
            $('#newJobOrderError').text("Invalid extra-large amount!");
            return;
        }

        if (smallOrder % 1 != 0 || mediumOrder % 1 != 0 || largeOrder % 1 != 0 || extraLargeOrder % 1 != 0) {
            $('#newJobOrderError').text("Orders must be in whole numbers!");
            return;
        }

        $.post('/admin/production/validateNewJobOrder', {batchNo: batchNo, style: style, color: color, description: description}, (data) => {
            if(data.jobOrderExists) {
                $('#newJobOrderError').text("Job order with the same batch number already exists!");
                return;
            }

            if (!data.productExists) {
                $('#newJobOrderError').text(style + " " + color + " " + description + " does not exist in the inventory!");
                return;
            }



            $('#newJobOrderForm').submit();
        })
    })

    $('#jobOrderCardContainer').on('click', '#resolveJobOrderBtn', function(e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        let errorMsg = $(this).parent().parent().find('div:nth-child(1)').find('div:nth-child(15)');
        errorMsg.text("");

        let smallOutput = $(this).parent().parent().find('div:nth-child(1)').find('input:nth-child(4)').val();
        let mediumOutput = $(this).parent().parent().find('div:nth-child(1)').find('input:nth-child(7)').val();
        let largeOutput = $(this).parent().parent().find('div:nth-child(1)').find('input:nth-child(10)').val();
        let extraLargeOutput = $(this).parent().parent().find('div:nth-child(1)').find('input:nth-child(13)').val();

        if (smallOutput == "" && mediumOutput == "" && largeOutput == "" && extraLargeOutput == "") {
            errorMsg.text("At least one output needed!");
            return;
        }

        if (smallOutput < 0 || smallOutput > MAX_INT) {
            errorMsg.text("Invalid small output!");
            return;
        }

        if (mediumOutput < 0 || mediumOutput > MAX_INT) {
            errorMsg.text("Invalid medium output!");
            return;
        }

        if (largeOutput < 0 || largeOutput > MAX_INT) {
            errorMsg.text("Invalid large output!");
            return;
        }

        if (extraLargeOutput < 0 || extraLargeOutput > MAX_INT) {
            errorMsg.text("Invalid extra large output!");
            return;
        }

        $(this).parent().parent().submit();

    })
    
    $('#productCardContainer').on('click', '#updateStockBtn',  function(e) {
        e.preventDefault();
        e.stopImmediatePropagation();

        let errorMsg = $(this).parent().parent().find('div:nth-child(1)').find('div:nth-child(13)');
        errorMsg.text('');

        let productId = $(this).parent().find('textarea:nth-child(1)').val();
        let s = $(this).parent().parent().find('div:nth-child(1)').find('input:nth-child(2)').val();
        let m = $(this).parent().parent().find('div:nth-child(1)').find('input:nth-child(5)').val();
        let l = $(this).parent().parent().find('div:nth-child(1)').find('input:nth-child(8)').val();
        let xl = $(this).parent().parent().find('div:nth-child(1)').find('input:nth-child(11)').val();
        
        if (s == "" && m == "" && l == "" && xl == "") {
            errorMsg.text("At least one update needed!");
            return;
        }

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

    $('#jobOrderCardContainer').on('change', '#jobOrderStatusDropdown', function(e) {
        let dropdown = $(this);
        dropdown.prop('disabled', true);

        let _id = dropdown.prev().val();

        $.post("/admin/production/updateJobOrderStatus", {_id: _id, status: dropdown.val()}, (data) => {
            if (!data) {
                alert('error in server request. status not updated');
                dropdown.prop('disabled', false);
                return;
            }

            dropdown.prop('disabled', false);
        })
    })


    $('#myTabContent').on('show.bs.modal', 'div[name="modal_edit"]', function(e) {
        
        let image = $(this).find('div:nth-child(1)').find('div:nth-child(1)').find('img:nth-child(1)');
        let id = $(this).find('div:nth-child(1)').find('div:nth-child(1)').find('textarea:nth-child(2)').val();
        

        $.get('/getProductImage', {_id: id}, (data) => {
            image.attr('src', '/productimgs/' + data)  
        })
        
    })

    $('#myTabContent').on('click', '#submitProductImage', function(e) {
        e.preventDefault();
        e.stopImmediatePropagation();

        let form = ($(this.form))[0]
        let file = ($(this).prevAll('input'))[0];
        let _id = $(this).prevAll('textarea').val();
        let error1 = $(this).prev('.text-danger');

        if (file.files[0] === undefined) {
            error1.text('Choose an image')
            return;
        }
        if (file.files[0].size >  (1048576 * 2)) {
            error1.text('Image should not be larger than 2MB!')
            return;
        }

        $(this.form).submit();
    })

    $('#addToCart').click(function(e) {
        e.preventDefault();
        e.stopImmediatePropagation();

        let productId = $('#specificProductId').val();
        let amount = $('#myNumber').val();
        let size = $('#specificProductSize').val();
        let style = $('#specificProductStyle').val();
        let color = $('#specificProductColor').text();
        let description = $('#specificProductDescription').val();
        let image = $('#specificProductImage').attr('src');
        let price = $('#specificProductPrice').val();
        
        let order = {
            productId: productId,
            amount: amount,
            size: size,
            style: style,
            color: color,
            description: description,
            image: image,
            price: Number(price) * amount
        }

        CART.add(order)
    });

    $('#checkOut').click(function(e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        $('#checkoutError').text('')
        let items = CART.contents;
        
        //if (items === undefined || items.length == 0) {
        //    $('#checkoutError').text('Cart empty!')
        //    return;
        //}
        
        $('#modal_customerInfo').modal('toggle')
    })

    $('#checkoutSubmit').click(function(e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        $('#submitCheckoutError').text("");
        
        let items = CART.contents;

        let captcha = $('#g-recaptcha-response').val();
        let firstname = $('#customerFirstName').val();
        let lastName = $('#customerLastName').val();
        let contactNo = $('#customerContact').val();
        let email = $('#customerEmail').val();
        let address = $('#customerAddress').val();
        let region = $('#customerInternational').is(':checked') ? 'INTERNATIONAL' : 'DOMESTIC';
        let paymentMode = $('#customerPaymentMode').val();
        let deliveryMode = $('#customerDeliveryMode').val();
        
        firstname = firstname.trim();
        lastName = lastName.trim();
        contactNo = contactNo.trim();
        email = email.trim();
        address = address.trim();
        paymentMode = paymentMode.trim();
        deliveryMode = deliveryMode.trim();

        if (firstname == "" || lastName == "" || contactNo == "" || email == "" || address  == "" || paymentMode == "" || deliveryMode == "") {
            $('#submitCheckoutError').text("Fields required!");
            return;
        }

        let regExp = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (!regExp.test(email)) {
            $('#submitCheckoutError').text("Please enter a valid email!");
            return;
        }

        if (captcha == "" || captcha == null) {
            $('#submitCheckoutError').text("Please prove that you are not a bot.");
            return;
        }

        $('#cart').val(JSON.stringify(items));
        $('#region').val(region);

        $.post('/cart/verifyCaptcha', {captcha: captcha}, (data) => {
            if (!data) {
                $('#submitCheckoutError').text("Invalid captcha");
                return;
            }

            CART.contents = [];
            CART.sync();
            $(this.form).submit();
        })
    })


})