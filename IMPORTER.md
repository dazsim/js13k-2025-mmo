Image Importer Technical Spec.

initial view should be an area to drop an image. 

This image when dropped into the app will be analysed. 

identify how many colours there are.

export each colour as a layer

data should start with width and height. width should be divisible by 8. If not, round up. 

e.g. if you drop a 64x64 image in to be processed the first 2 bytes should be 8 for the width (8x8) and 64 for the height.

The rest of the file should be a binary representation of that colour. E.g. if the first 8 pixels of the image are white and we are looking for white data we write FF to the third byte of the output buffer. If the next 8 pixels are 4 white and 4 red then it should write F0 to the 4th byte of the buffer. If you're not sure how this works, ask me questions and I will add additional information.

each layer should be output below the input area. Warn if there are more than 4 colours

a 64x64 image should compress down into 514 bytes (8 x 64 + 2 bytes for size)

Output should each colour sequentially.

e.g. we drop a 4 colour image into the app. It pulls the data out and creates 4 new divs below the input area.

each output div has a canvas on the left showing the extracted colour and on the right the raw data extracted as a hex string (e.g. 0840FFF0... in the above example) 

text should be easy to copy and then paste into a game for rendering.

1. Color identification: Should I treat colors as exact matches, or should there be some tolerance for similar colors? For example, if there are slight variations in what appears to be "white" pixels, should they be grouped together?

a: match colours exactly. 

2. Color ordering: When outputting the layers, should they be in any particular order (e.g., by frequency, by color value, or as they appear in the image)?

a: process colours in the order you find them in the image. No need to worry about order.

3. Canvas display: For the canvas preview of each extracted color layer, should it show:
The original image with only that color visible (others transparent/black)?
A simple solid color swatch?
The binary pattern representation?

a: original image with only that color visible.

4. Width rounding: When rounding up the width to be divisible by 8, should I pad the extra pixels with a specific color (like black/transparent) or repeat the last pixel?

a: to clarify. You should have an output array of bytes you generate. each byte has 8 bits. These can represent if that colour is present. So if you have 8 pixels that are white, you can represent that as 0x11111111 or FF(hex)

5. File format: The spec mentions "binary representation" - should the hex output be in a specific format that can be easily copied into a game? Any particular encoding or structure?

a: hopefully my answer to 4. explains that. The output should be 1 byte for width, 1 for height.

6. Error handling: How should I handle edge cases like:
    Very large images?

    a: max image size based on initial implementation is 2040 x 255

    Images with transparency?

    ignore transparency. Just identify colours and create the output as described above

    Images that are already smaller than 8 pixels wide?

    round up to 8 pixels