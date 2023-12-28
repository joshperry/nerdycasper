{
  description = "nerdycasper conversion";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-23.11";
    devenv.url = "github:cachix/devenv";
  };

  outputs = inputs@{ flake-parts, ... }:
    flake-parts.lib.mkFlake { inherit inputs; } {
      imports = [
        inputs.devenv.flakeModule
      ];
      systems = [ "x86_64-linux" "i686-linux" "x86_64-darwin" "aarch64-linux" "aarch64-darwin" ];

      perSystem = { config, self', inputs', pkgs, system, ... }: {

        devenv.shells.default = {
          languages.javascript.enable = true;

          imports = [ ];

          env = {
          };

          packages = with pkgs;[
            yarn
            nodePackages.typescript-language-server
            nodePackages.eslint
          ];
        };

      };
    };
}
