{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {

  buildInputs = [ pkgs.nodejs_21 ];  

  TZDIR = "/usr/share/zoneinfo/";
  TZ = "Europe/Rome";
  LANG = "en_US.UTF-8";

  shellHook = ''    
    echo "NodeJS 21"
    export PATH="./node_modules/.bin:$PATH"
  '';
}