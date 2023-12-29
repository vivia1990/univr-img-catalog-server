{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {

  buildInputs = [ pkgs.nodejs_21 pkgs.yarn ];

  shellHook = ''
    echo "Entering the Nix shell with java version: ${pkgs.jdk21.version}"
  '';
}