with open('app/main.py', 'r') as f:
    lines = f.readlines()

# Comment out lines 22-24
lines[21] = '# ' + lines[21]  # @app.on_event("startup")
lines[22] = '# ' + lines[22]  # def on_startup():
lines[23] = '#' + lines[23]   #     ensure_schema()

with open('app/main.py', 'w') as f:
    f.writelines(lines)

print("Fixed!")
