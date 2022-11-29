import os
import cairosvg

# Create folder for 128
if not os.path.exists('128'):
   os.makedirs('128')

# Create folder for 64
if not os.path.exists('64'):
   os.makedirs('64')

# Create folder for 32
if not os.path.exists('32'):
   os.makedirs('32')

# Create folder for 16
if not os.path.exists('16'):
   os.makedirs('16')



# Convert SVG to PNG and save to folder 128
for filename in os.listdir(os.getcwd()):
    if filename.endswith(".svg"):
        print(filename)
        cairosvg.svg2png(url=filename, write_to="128/"+os.path.splitext(filename)[0]+'.png', output_height=128)
        cairosvg.svg2png(url=filename, write_to="64/"+os.path.splitext(filename)[0]+'.png', output_height=64)
        cairosvg.svg2png(url=filename, write_to="32/"+os.path.splitext(filename)[0]+'.png', output_height=32)
        cairosvg.svg2png(url=filename, write_to="16/"+os.path.splitext(filename)[0]+'.png', output_height=16)

