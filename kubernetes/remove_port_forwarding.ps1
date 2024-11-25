# PowerShell Script to Remove Port Forwarding in WSL
# Run this script in an elevated PowerShell session
netsh interface portproxy delete v4tov4 listenport=6443 listenaddress=0.0.0.0
netsh interface portproxy delete v4tov4 listenport=2379 listenaddress=0.0.0.0
netsh interface portproxy delete v4tov4 listenport=2380 listenaddress=0.0.0.0
netsh interface portproxy delete v4tov4 listenport=10250 listenaddress=0.0.0.0
netsh interface portproxy delete v4tov4 listenport=10251 listenaddress=0.0.0.0
netsh interface portproxy delete v4tov4 listenport=10252 listenaddress=0.0.0.0
